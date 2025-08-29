import Fastify from 'fastify';
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from './db';
import type { Prisma } from '@prisma/client';
// import type { Order } from '@prisma/client';

// ------------------------------
// SSE utilities
// ------------------------------
// const sseClients = new Set<{ id: string; write: (chunk: string) => void }>();

// type SSEPayload =
//   | { type: 'hello' }
//   | { type: 'order_created'; order: Order }
//   | { type: 'order_updated'; order: Order };

// function sseBroadcast(data: SSEPayload) {
//   const payload = `data: ${JSON.stringify(data)}\n\n`;
//   for (const c of sseClients) c.write(payload);
// }

type Client = { write: (chunk: string) => void; close: () => void };
const clients = new Set<Client>();

function sseBroadcast(event: string, data: unknown) {
  const packet = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of [...clients]) {
    try {
      c.write(packet);
    } catch {
      clients.delete(c);
    }
  }
}

// ------------------------------
// Validation Schemas (zod)
// ------------------------------
const MenuItemDTO = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  price: z.number().nonnegative(),
  category: z.string().nullable().optional(),
  is_available: z.boolean().optional(),
});

const OrderStatusEnum = z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']);
// const OrderStatusEnum = z.enum(['preparing', 'ready']);

const OrderItemDTO = z.object({
  item_id: z.number().int().positive(),
  qty: z.number().int().positive(),
  toppings: z.array(z.number().int().positive()).optional(),
});

const OrderDTO = z.object({
  order_id: z.number().int().positive(),
  items: z.array(OrderItemDTO),
  total_price: z.number().nonnegative(),
  status: OrderStatusEnum,
  created_at: z
    .string()
    .datetime()
    .or(z.date().transform((d) => d.toISOString())),
  completed_at: z.string().datetime().nullable().optional(),
});

const DateRangeQuery = z.object({
  from: z.string().date().optional(), // 'YYYY-MM-DD'
  to: z.string().date().optional(),
});

const OrderItemSchema = z.object({
  item_id: z.number().int().positive(),
  qty: z.number().int().min(1),
  toppings: z.array(z.number().int().positive()).optional(),
});

const CreateOrderBody = z.object({
  items: z.array(OrderItemSchema).min(1),
  // total_price ไม่ต้องรับจาก client เพื่อกันข้อมูลเพี้ยน ให้คำนวณฝั่งเซิร์ฟเวอร์
});

const CreateOrderResponse = z.object({
  order_id: z.number().int().positive(),
});

const OrderIdParams = z.object({ id: z.string().regex(/^\d+$/) });

const UpdateOrderBody = z.object({
  order_id: z.number().int().positive(),
  status: OrderStatusEnum, // 'preparing' | 'ready'
});

const UpdateOrderResponse = z.object({
  order_id: z.number().int().positive(),
  status: OrderStatusEnum,
  completed_at: z.string().datetime().nullable(),
});

const SalesQuery = z.object({
  from: z.string().date().optional(), // 'YYYY-MM-DD'
  to: z.string().date().optional(), // 'YYYY-MM-DD'
});

const SalesPointDTO = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  orders: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

const TopMenuQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

const TopMenuItemDTO = z.object({
  item_id: z.number().int().positive(),
  name: z.string(),
  qty: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

const PeakRowDTO = z.object({
  hour: z.number().int().min(0).max(23),
  orders: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});
const PeakHoursResponse = z.object({ hours: z.array(PeakRowDTO) });

// ------------------------------
// Server bootstrap
// ------------------------------
async function start() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    // exposedHeaders: [] // เพิ่มถ้าจำเป็น
  });
  await app.register(swagger, {
    openapi: {
      info: { title: 'SmartCafe API', version: '0.2.0' },
      servers: [{ url: 'http://localhost:4000' }],
    },
    transform: jsonSchemaTransform, // ให้ Zod แปลงเป็น JSON Schema
  });

  await app.register(swaggerUI, {
    routePrefix: '/api/docs',
    staticCSP: true,
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

  // Auth (mock)
  app.post('/api/authen', async (_req, reply) => {
    const token = jwt.sign({ sub: 'demo-user' }, JWT_SECRET, { expiresIn: '1h' });
    return reply.send({ token, expires_in: 3600 });
  });

  // Menu
  app.get(
    '/api/menu',
    {
      schema: {
        summary: 'List menu items',
        tags: ['menu'],
        response: { 200: z.object({ items: z.array(MenuItemDTO) }) },
      },
    },
    async (_req, reply) => {
      const items = await prisma.menuItem.findMany({
        orderBy: [{ id: 'asc' }, { name: 'asc' }],
      });

      reply.send({
        items: items.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
        })),
      });
    },
  );

  // Order
  app.post(
    '/api/order',
    {
      schema: {
        summary: 'Create a new order',
        tags: ['orders'],
        body: CreateOrderBody, // z.object({ items: [{ item_id, qty, toppings? }] })
        response: {
          201: CreateOrderResponse, // { order_id }
          400: z.object({
            message: z.string(),
            missing_item_ids: z.array(z.number().int().positive()).optional(),
          }),
        },
      },
    },
    async (req, reply) => {
      const body = req.body;

      // 1) ดึงรายการเมนูที่มีอยู่จริงตาม id ที่ถูกส่งมา
      const ids = [...new Set(body.items.map((i) => i.item_id))];
      const found = await prisma.menuItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, price: true, name: true },
      });
      const foundIds = new Set(found.map((m) => m.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      const nameMap = new Map(found.map((m) => [m.id, m.name]));

      // 2) ถ้ามี id ที่ไม่พบ ให้ตอบ 400 พร้อมรายการที่หายไป
      if (missing.length > 0) {
        return reply.code(400).send({
          message: 'Some item_id do not exist',
          missing_item_ids: missing,
        });
      }

      // 3) รวมราคาจากเมนูจริง (กัน client ปลอมราคา)
      const priceMap = new Map(found.map((m) => [m.id, m.price]));
      const total = body.items.reduce(
        (sum, it) => sum + (priceMap.get(it.item_id) ?? 0) * it.qty,
        0,
      );

      // 4) ทำงานในทรานแซกชัน (กัน partial write)
      const created = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            status: 'preparing',
            totalPrice: total,
          },
        });

        // ใส่รายการสินค้า (ทุก item_id ผ่านการยืนยันแล้ว จึงไม่ชน FK)
        await tx.orderItem.createMany({
          data: body.items.map((it) => ({
            orderId: order.id,
            itemId: it.item_id,
            qty: it.qty,
            // ถ้า schema เป็น Json: ใส่ได้เลย; ถ้าเป็น Int[] (Postgres) ก็แปลงตามจริง
            toppings: it.toppings ?? [],
            price: priceMap.get(it.item_id)!,
          })),
        });

        return order;
      });

      const payloadCreated = {
        type: 'order_created',
        order_id: created.id,
        status: 'preparing',
        total_price: total,
        items: body.items.map((it) => ({
          item_id: it.item_id,
          qty: it.qty,
          name: nameMap.get(it.item_id) ?? `#${it.item_id}`,
        })),
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      sseBroadcast('order_created', payloadCreated);

      return reply.code(201).send({ order_id: created.id });
    },
  );

  // Get order by id
  app.get(
    '/api/order/:id',
    {
      schema: {
        summary: 'Get order by id',
        tags: ['orders'],
        params: OrderIdParams,
        response: { 200: OrderDTO, 404: z.object({ message: z.string() }) },
      },
    },
    async (req, reply) => {
      const { id } = req.params; // validated แล้ว เป็น string ตัวเลข
      const orderId = Number(id);
      const found = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { item: true } } },
      });
      if (!found) return reply.code(404).send({ message: 'not found' });

      return reply.send({
        order_id: found.id,
        items: found.items.map((it) => ({
          item_id: it.itemId,
          qty: it.qty,
          toppings: (it.toppings as number[] | null) ?? [],
        })),
        total_price: found.totalPrice,
        status: found.status as z.infer<typeof OrderStatusEnum>,
        created_at: found.createdAt.toISOString(),
        completed_at: found.completedAt ? found.completedAt.toISOString() : null,
      });
    },
  );

  // Update order status
  app.patch(
    '/api/order/update',
    {
      schema: {
        summary: 'Update order status',
        tags: ['orders'],
        body: UpdateOrderBody,
        response: { 200: UpdateOrderResponse, 404: z.object({ message: z.string() }) },
      },
    },
    async (req, reply) => {
      const { order_id, status } = req.body;

      const exists = await prisma.order.findUnique({
        where: { id: order_id },
        select: { id: true, completedAt: true },
      });
      if (!exists) return reply.code(404).send({ message: 'not found' });

      const data: Prisma.OrderUpdateInput = { status };

      // ✅ เซ็ต completedAt เมื่อทำเสร็จ (ครั้งแรกเท่านั้น)
      if (status === 'ready' && !exists.completedAt) {
        data.completedAt = new Date();
      }

      const updated = await prisma.order.update({ where: { id: order_id }, data });

      const payload = {
        order_id,
        status: updated.status as 'preparing' | 'ready',
        completed_at: updated.completedAt ? updated.completedAt.toISOString() : null,
      };

      sseBroadcast('order_updated', { type: 'order_updated', ...payload, ts: Date.now() });

      return reply.send(payload);
    },
  );

  // List orders (optional status filter)
  app.get('/api/orders', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const status = url.searchParams.get('status') as 'preparing' | 'ready' | null;

    // const list = await prisma.order.findMany({
    //   where: status ? { status } : undefined,
    //   orderBy: { createdAt: 'desc' },
    //   include: { items: true },
    // });

    // return reply.send(
    //   list.map((o) => ({
    //     order_id: o.id,
    //     items: o.items.map((it) => ({
    //       item_id: it.itemId,
    //       qty: it.qty,
    //       toppings: it.toppings ?? [],
    //     })),
    //     total_price: o.totalPrice,
    //     status: o.status,
    //     created_at: o.createdAt,
    //     completed_at: o.completedAt,
    //   })),
    // );
    const rows = await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { id: 'desc' },
      include: {
        items: {
          select: {
            itemId: true,
            qty: true,
            item: {
              // << ใช้ relation ที่ชื่อ item
              select: { name: true, price: true },
            },
          },
        },
      },
    });

    const data = rows.map((o) => ({
      order_id: o.id,
      status: o.status as 'preparing' | 'ready',
      total_price: o.totalPrice,
      items: o.items.map((it) => ({
        item_id: it.itemId,
        qty: it.qty,
        name: it.item.name, // << ใช้ได้แล้ว
      })),
      created_at: o.createdAt.toISOString(),
      completed_at: o.completedAt ? o.completedAt.toISOString() : null,
    }));

    reply.send(data);
  });

  // --- Analytics ---
  app.get(
    '/api/analytics/sales',
    {
      schema: {
        summary: 'Daily sales (orders & revenue aggregated by day)',
        tags: ['analytics'],
        querystring: SalesQuery,
        response: {
          200: z.array(SalesPointDTO),
        },
      },
    },
    async (req, reply) => {
      const { from, to } = req.query;
      const fromD = from ? new Date(`${from}T00:00:00`) : undefined;
      const toD = to ? new Date(`${to}T23:59:59`) : undefined;

      // ดึงเฉพาะช่วงเวลาที่ต้องการเพื่อลดภาระหน่วยความจำ
      const orders = await prisma.order.findMany({
        where: {
          ...(fromD || toD
            ? {
                createdAt: {
                  ...(fromD ? { gte: fromD } : {}),
                  ...(toD ? { lte: toD } : {}),
                },
              }
            : {}),
        },
        select: { createdAt: true, totalPrice: true },
      });

      const map = new Map<string, { date: string; orders: number; revenue: number }>();

      for (const o of orders) {
        const d = new Date(o.createdAt);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
        const row = map.get(key) || { date: key, orders: 0, revenue: 0 };
        row.orders += 1;
        row.revenue += o.totalPrice;
        map.set(key, row);
      }

      const data = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
      return reply.send(data);
    },
  );

  app.get(
    '/api/analytics/top-menu',
    {
      schema: {
        summary: 'Top selling menu items',
        tags: ['analytics'],
        querystring: TopMenuQuery,
        response: {
          200: z.array(TopMenuItemDTO),
        },
      },
    },
    async (req, reply) => {
      const { limit, from, to } = req.query;
      const fromD = from ? new Date(`${from}T00:00:00`) : undefined;
      const toD = to ? new Date(`${to}T23:59:59`) : undefined;

      const items = await prisma.orderItem.findMany({
        include: { item: true, order: true },
      });

      const count = new Map<
        number,
        { item_id: number; name: string; qty: number; revenue: number }
      >();

      for (const it of items) {
        const d = new Date(it.order.createdAt);
        if (fromD && d < fromD) continue;
        if (toD && d > toD) continue;

        const row = count.get(it.itemId) || {
          item_id: it.itemId,
          name: it.item?.name ?? `#${it.itemId}`,
          qty: 0,
          revenue: 0,
        };

        row.qty += it.qty;
        row.revenue += (it.item?.price ?? 0) * it.qty;
        count.set(it.itemId, row);
      }

      return reply.send(
        Array.from(count.values())
          .sort((a, b) => b.qty - a.qty)
          .slice(0, limit),
      );
    },
  );

  app.get(
    '/api/analytics/peak-hours',
    {
      schema: {
        summary: 'Peak hours (orders & revenue per hour)',
        tags: ['analytics'],
        querystring: DateRangeQuery,
        response: { 200: PeakHoursResponse },
      },
    },
    async (req, reply) => {
      const { from, to } = req.query;
      const fromD = from ? new Date(`${from}T00:00:00`) : undefined;
      const toD = to ? new Date(`${to}T23:59:59`) : undefined;

      const rows = await prisma.order.findMany({
        where: {
          ...(fromD || toD
            ? {
                createdAt: {
                  ...(fromD ? { gte: fromD } : {}),
                  ...(toD ? { lte: toD } : {}),
                },
              }
            : {}),
        },
        include: { items: true },
      });

      const hours = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        orders: 0,
        revenue: 0,
      }));

      for (const o of rows) {
        const h = o.createdAt.getHours();
        if (hours[h]) {
          hours[h].orders += 1;
          hours[h].revenue += o.totalPrice;
        }
      }

      reply.send({ hours });
    },
  );

  // SSE stream
  app.get('/api/orders/stream', { config: { compress: false } }, async (req, reply) => {
    reply.hijack();

    const res = reply.raw;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    if (typeof (res as { flushHeaders?: () => void }).flushHeaders === 'function') {
      res.flushHeaders();
    }

    const client: Client = {
      write: (chunk) => res.write(chunk),
      close: () => {
        clearInterval(heartbeat);
        clients.delete(client);
        res.end();
      },
    };
    clients.add(client);

    // แจ้งค่าเริ่มต้น + กำหนด retry
    res.write(`retry: 3000\n\n`);
    res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 15000);

    req.raw.on('close', () => client.close());
  });

  // Start
  const port = Number(process.env.PORT || 4000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`API ready on http://localhost:${port}`);
  app.log.info(`Docs at http://localhost:${port}/api/docs`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
export {};
