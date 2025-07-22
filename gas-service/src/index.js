import { app } from './app.js';

if (process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => console.log('Gas Service running on 3001'));
}
