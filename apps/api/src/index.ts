// apps/api/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

// ------------------------------
// Types & Mock DB
// ------------------------------
type Order = {
  order_id: number;
  items: { item_id: number; toppings?: number[]; qty: number }[];
  total_price: number;
  status: 'preparing' | 'ready';
  created_at: string;
  completed_at: string | null;
};

const menu = Array.from({ length: 20 }).map((_, i) => ({
  item_id: i + 1,
  name: ['Americano', 'Latte', 'Cappuccino', 'Mocha'][i % 4] + ' #' + (i + 1),
  price: 60 + (i % 5) * 5,
  img: '',
}));

let seq = 1000;
const orders = new Map<number, Order>();

// ------------------------------
// SSE utilities
// ------------------------------
const sseClients = new Set<{ id: string; write: (chunk: string) => void }>();

type SSEPayload =
  | { type: 'hello' }
  | { type: 'order_created'; order: Order }
  | { type: 'order_updated'; order: Order };

function sseBroadcast(data: SSEPayload) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const c of sseClients) c.write(payload);
}

// ------------------------------
// Validation Schemas (zod)
// ------------------------------
const AuthRes = z.object({ token: z.string(), expires_in: z.number() });

const OrderItem = z.object({
  item_id: z.number(),
  toppings: z.number().array().optional(),
  qty: z.number().min(1),
});

const CreateOrderBody = z.object({
  items: z.array(OrderItem),
  total_price: z.number().nonnegative(),
});

const UpdateOrderBody = z.object({
  order_id: z.number(),
  status: z.enum(['preparing', 'ready']),
});

// ------------------------------
// Server bootstrap
// ------------------------------
async function start() {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, {
    origin: ['http://localhost:3000'], // ชี้เฉพาะต้นทาง dev ของคุณ
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'SmartCafe API', version: '0.1.0' },
    },
  });
  await app.register(swaggerUI, { routePrefix: '/api/docs' });

  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

  // ----------------------------
  // Routes
  // ----------------------------
  app.post('/api/authen', async (_req, reply) => {
    const token = jwt.sign({ sub: 'demo-user' }, JWT_SECRET, { expiresIn: '1h' });
    return reply.send(AuthRes.parse({ token, expires_in: 3600 }));
  });

  app.get('/api/menu', async (_req, reply) => {
    return reply.send(menu);
  });

  app.post('/api/order', async (req, reply) => {
    const body = CreateOrderBody.parse(req.body);
    const id = ++seq;
    const now = new Date().toISOString();
    const order: Order = {
      order_id: id,
      items: body.items,
      total_price: body.total_price,
      status: 'preparing',
      created_at: now,
      completed_at: null,
    };
    orders.set(id, order);
    sseBroadcast({ type: 'order_created', order });
    return reply.send({ order_id: id });
  });

  const OrderIdParams = z.object({ id: z.string().regex(/^\d+$/) });

  app.get('/api/order/:id', async (req, reply) => {
    const { id } = OrderIdParams.parse(req.params);
    const found = orders.get(Number(id));
    if (!found) return reply.code(404).send({ message: 'not found' });
    return reply.send(found);
  });

  app.patch('/api/order/update', async (req, reply) => {
    const body = UpdateOrderBody.parse(req.body);
    const found = orders.get(body.order_id);
    if (!found) return reply.code(404).send({ message: 'not found' });
    found.status = body.status;
    if (body.status === 'ready') found.completed_at = new Date().toISOString();
    sseBroadcast({ type: 'order_updated', order: found });
    return reply.send({ order_id: found.order_id, status: found.status });
  });

  // SSE stream for real-time updates
  app.get('/api/orders/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    const client = {
      id: Math.random().toString(36).slice(2),
      write: (chunk: string) => reply.raw.write(chunk),
    };
    sseClients.add(client);
    req.raw.on('close', () => {
      sseClients.delete(client);
    });
    // initial ping
    client.write(`data: ${JSON.stringify({ type: 'hello' })}\n\n`);
    return reply; // keep open
  });

  // GET /api/orders – list orders (ทั้งหมด หรือ filter ผ่าน query)
  app.get('/api/orders', async (req, reply) => {
    // query: status=preparing|ready (optional)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const status = url.searchParams.get('status') as 'preparing' | 'ready' | null;

    let list = Array.from(orders.values());
    if (status) list = list.filter((o) => o.status === status);

    // เรียงตามเวลา สร้างใหม่ -> เก่า
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return reply.send(list);
  });

  // --- Analytics Helpers ---
  function withinRange(d: Date, from?: Date, to?: Date) {
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }

  // GET /api/analytics/sales?from=2025-08-01&to=2025-08-31
  app.get('/api/analytics/sales', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const fromD = from ? new Date(from + 'T00:00:00') : undefined;
    const toD = to ? new Date(to + 'T23:59:59') : undefined;

    const map = new Map<string, { date: string; orders: number; revenue: number }>();
    for (const o of orders.values()) {
      const d = new Date(o.created_at);
      if (!withinRange(d, fromD, toD)) continue;
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key) || { date: key, orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += o.total_price;
      map.set(key, row);
    }
    const rows = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    return reply.send(rows);
  });

  // GET /api/analytics/top-menu?limit=10&from=...&to=...
  app.get('/api/analytics/top-menu', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 10);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const fromD = from ? new Date(from + 'T00:00:00') : undefined;
    const toD = to ? new Date(to + 'T23:59:59') : undefined;

    const count = new Map<
      number,
      { item_id: number; name: string; qty: number; revenue: number }
    >();
    for (const o of orders.values()) {
      const d = new Date(o.created_at);
      if (!withinRange(d, fromD, toD)) continue;
      for (const it of o.items) {
        const m = menu.find((m) => m.item_id === it.item_id);
        const row = count.get(it.item_id) || {
          item_id: it.item_id,
          name: m?.name || `#${it.item_id}`,
          qty: 0,
          revenue: 0,
        };
        row.qty += it.qty;
        row.revenue += (m?.price || 0) * it.qty;
        count.set(it.item_id, row);
      }
    }
    const rows = Array.from(count.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
    return reply.send(rows);
  });

  // GET /api/analytics/peak-hours?from=...&to=...
  app.get('/api/analytics/peak-hours', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const fromD = from ? new Date(from + 'T00:00:00') : undefined;
    const toD = to ? new Date(to + 'T23:59:59') : undefined;

    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
    for (const o of orders.values()) {
      if (!o.created_at || !o.total_price) continue; // ข้ามถ้าไม่มีค่า

      const d = new Date(o.created_at);
      if (!withinRange(d, fromD, toD)) continue;

      const h = d.getHours();
      if (hours[h]) {
        hours[h].orders += 1;
        hours[h].revenue += o.total_price ?? 0;
      }
    }

    return reply.send(hours);
  });

  const port = Number(process.env.PORT || 4000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`API ready on http://localhost:${port}`);
  app.log.info(`Docs at http://localhost:${port}/api/docs`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Ensure this file is treated as a module
export {};
