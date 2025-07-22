import request from 'supertest';
import { app } from '../src/app.js';

describe('Balance Service', () => {
  it('POST /check-tokens без тела → 500', async () => {
    const res = await request(app)
      .post('/check-tokens')
      .send({});
    expect(res.status).toBe(500);
  });
});
