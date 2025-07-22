import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import fs from 'fs';

export const app = express();
const secret = fs.readFileSync('/run/secrets/jwt_secret', 'utf8');

const proxyTransfer = createProxyMiddleware({ target: 'http://transfer-service:3000', changeOrigin: true, logLevel: 'debug' });
const proxyGas = createProxyMiddleware({ target: 'http://gas-service:3001', changeOrigin: true, logLevel: 'debug' });
const proxyBalance = createProxyMiddleware({ target: 'http://balance-service:3002', changeOrigin: true, logLevel: 'debug' });

app.use((req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token is missing' });

  try {
    jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.use((req, res, next) => {
  if (req.path === '/transfer') return proxyTransfer(req, res, next);
  if (req.path === '/gas') return proxyGas(req, res, next);
  if (req.path === '/balance') return proxyBalance(req, res, next);
  next();
});

app.get('/', (_req, res) => res.send('API Gateway is alive'));
app.use((_req, res) => res.status(404).send('Not Found'));
