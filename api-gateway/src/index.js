import { app } from './app.js';

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
}
