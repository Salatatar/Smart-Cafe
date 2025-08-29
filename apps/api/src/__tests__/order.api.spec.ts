import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { prisma } from '../db';
import { buildApp } from '../index'; // ต้องมีตามที่ refactor แนะนำ

let app: Awaited<ReturnType<typeof buildApp>>;
let menuId1: number;
let createdOrderId: number;

async function resetDb() {
  // ลบตามลำดับ FK
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
}

beforeAll(async () => {
  app = await buildApp();

  // เตรียม DB สำหรับเทสต์
  await resetDb();
  const m1 = await prisma.menuItem.create({
    data: { name: 'Americano', price: 60 },
  });
  menuId1 = m1.id;

  // เพิ่มอีกสักตัวเพื่อใช้ใน analytics/top-menu
  await prisma.menuItem.create({
    data: { name: 'Latte', price: 75 },
  });
});

afterAll(async () => {
  await app.close();
});

describe('SmartCafe API', () => {
  it('GET /api/menu returns items', async () => {
    const res = await request(app.server).get('/api/menu');
    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty('id');
    expect(res.body.items[0]).toHaveProperty('name');
    expect(res.body.items[0]).toHaveProperty('price');
  });

  it('POST /api/order creates order and returns {order_id} with 201', async () => {
    const res = await request(app.server)
      .post('/api/order')
      .set('Content-Type', 'application/json')
      .send({
        items: [{ item_id: menuId1, qty: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order_id');
    expect(typeof res.body.order_id).toBe('number');
    createdOrderId = res.body.order_id;
  });

  it('GET /api/order/:id returns order DTO', async () => {
    const res = await request(app.server).get(`/api/order/${createdOrderId}`);
    expect(res.status).toBe(200);

    // โครงสร้างตาม OrderDTO
    expect(res.body).toMatchObject({
      order_id: createdOrderId,
      total_price: expect.any(Number),
      status: expect.stringMatching(/^(pending|preparing|ready|completed|cancelled)$/),
      created_at: expect.any(String),
      completed_at: null, // ยังไม่พร้อม
    });

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0]).toMatchObject({
      item_id: menuId1,
      qty: 2,
      toppings: expect.any(Array),
    });
  });

  it('GET /api/orders returns list and can filter by status', async () => {
    // ทั้งหมด
    const all = await request(app.server).get('/api/orders');
    expect(all.status).toBe(200);
    expect(Array.isArray(all.body)).toBe(true);
    expect(all.body.length).toBeGreaterThan(0);

    // filter status=preparing
    const prep = await request(app.server).get('/api/orders?status=preparing');
    expect(prep.status).toBe(200);
    expect(Array.isArray(prep.body)).toBe(true);
    // ออเดอร์ที่เพิ่งสร้างควรอยู่ใน preparing
    const found = prep.body.find((o: any) => o.order_id === createdOrderId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('preparing');

    // ตรวจว่ามี name ใน items (เพราะ select item.name ในโค้ด)
    expect(found.items[0]).toHaveProperty('name');
  });

  it('PATCH /api/order/update can update to ready and set completed_at (first time)', async () => {
    const res = await request(app.server)
      .patch('/api/order/update')
      .set('Content-Type', 'application/json')
      .send({ order_id: createdOrderId, status: 'ready' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      order_id: createdOrderId,
      status: 'ready',
    });
    // ตามโค้ด: เมื่อเปลี่ยนเป็น ready ครั้งแรกจะเซ็ต completedAt
    expect(res.body.completed_at).toEqual(expect.any(String));

    // เรียกซ้ำอีกรอบเป็น ready อีกรอบ completed_at ควรคงเดิม (ไม่เป็น null)
    const res2 = await request(app.server)
      .patch('/api/order/update')
      .set('Content-Type', 'application/json')
      .send({ order_id: createdOrderId, status: 'ready' });

    expect(res2.status).toBe(200);
    expect(res2.body.completed_at).toEqual(expect.any(String));
  });

  // --- Analytics ---
  it('GET /api/analytics/sales returns array of {date,orders,revenue}', async () => {
    const res = await request(app.server).get('/api/analytics/sales');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toMatchObject({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        orders: expect.any(Number),
        revenue: expect.any(Number),
      });
    }
  });

  it('GET /api/analytics/top-menu returns array of top items', async () => {
    const res = await request(app.server).get('/api/analytics/top-menu?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toMatchObject({
        item_id: expect.any(Number),
        name: expect.any(String),
        qty: expect.any(Number),
        revenue: expect.any(Number),
      });
    }
  });

  it('GET /api/analytics/peak-hours returns {hours: [24 rows]}', async () => {
    const res = await request(app.server).get('/api/analytics/peak-hours');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hours');
    expect(Array.isArray(res.body.hours)).toBe(true);
    expect(res.body.hours.length).toBe(24);
    expect(res.body.hours[0]).toMatchObject({
      hour: expect.any(Number),
      orders: expect.any(Number),
      revenue: expect.any(Number),
    });
  });
});
