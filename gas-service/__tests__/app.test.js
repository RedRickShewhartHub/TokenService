import request from 'supertest';
import { app } from '../src/app.js';

describe('Gas Service', () => {
  it('POST /check-tx-gas без тела → 500', async () => {
    const res = await request(app)
      .post('/check-tx-gas')
      .send({});
    expect(res.status).toBe(500);
  });
});
