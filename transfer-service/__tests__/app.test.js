import request from 'supertest';
import { app } from '../src/app.js';

describe('Transfer Service', () => {
  it('GET /health → 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('POST /transfer без тела → 400', async () => {
    const res = await request(app)
      .post('/transfer')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userAddress & amount required/);
  });
});
