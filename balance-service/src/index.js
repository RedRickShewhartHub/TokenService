import { app } from './app.js';

if (process.env.NODE_ENV !== 'test') {
  app.listen(3002, () => console.log('Balance Service running on 3002'));
}
