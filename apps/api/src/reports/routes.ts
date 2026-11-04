import { Router } from 'express';
import {
  dateRangeSchema,
  ordersQuerySchema,
  productsQuerySchema,
  salesQuerySchema,
  topCustomersQuerySchema,
} from '@statlume/shared';
import type { Pool } from '../db/pool.ts';
import { parse } from '../http.ts';
import * as reports from './queries.ts';

export function reportsRouter(pool: Pool): Router {
  const router = Router();

  router.get('/reports/kpis', async (req, res) => {
    const { from, to } = parse(dateRangeSchema, req.query);
    res.json(await reports.kpis(pool, from, to));
  });

  router.get('/reports/sales', async (req, res) => {
    const { from, to, interval } = parse(salesQuerySchema, req.query);
    res.json(await reports.sales(pool, from, to, interval));
  });

  router.get('/reports/products', async (req, res) => {
    const q = parse(productsQuerySchema, req.query);
    res.json({ rows: await reports.products(pool, q) });
  });

  router.get('/reports/customers', async (req, res) => {
    const { from, to, interval } = parse(salesQuerySchema, req.query);
    res.json(await reports.customers(pool, from, to, interval));
  });

  router.get('/reports/top-customers', async (req, res) => {
    const { from, to, limit } = parse(topCustomersQuerySchema, req.query);
    res.json({ rows: await reports.topCustomers(pool, from, to, limit) });
  });

  router.get('/orders', async (req, res) => {
    const q = parse(ordersQuerySchema, req.query);
    res.json(await reports.orders(pool, q));
  });

  return router;
}
