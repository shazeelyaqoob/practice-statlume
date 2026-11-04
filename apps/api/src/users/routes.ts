import argon2 from 'argon2';
import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { createUserSchema, updateUserSchema } from '@statlume/shared';
import { z } from 'zod';
import type { Pool } from '../db/pool.ts';
import { toPublicUser } from '../auth/service.ts';
import { badRequest, conflict, forbidden, notFound, parse } from '../http.ts';

const idParam = z.object({ id: z.coerce.number().int().positive() });

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
  is_demo: 0 | 1;
  created_at: string;
}

/** Admin-only user management. Mounted behind requireRole('admin'). */
export function usersRouter(pool: Pool): Router {
  const router = Router();

  const getUser = async (id: number) => {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, email, name, role, is_demo, created_at FROM users WHERE id = ?',
      [id],
    );
    if (!rows[0]) throw notFound('User not found');
    return rows[0];
  };

  const adminCount = async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'admin'",
    );
    return Number(rows[0]?.n ?? 0);
  };

  router.get('/', async (_req, res) => {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, email, name, role, is_demo, created_at FROM users ORDER BY id',
    );
    res.json({ rows: rows.map((r) => ({ ...toPublicUser(r), isDemo: r.is_demo === 1 })) });
  });

  router.post('/', async (req, res) => {
    const body = parse(createUserSchema, req.body);
    const hash = await argon2.hash(body.password);
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
        [body.email, body.name, hash, body.role],
      );
      const user = await getUser(result.insertId);
      res.status(201).json({ user: { ...toPublicUser(user), isDemo: false } });
    } catch (err) {
      if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw conflict('A user with this email already exists');
      }
      throw err;
    }
  });

  router.patch('/:id', async (req, res) => {
    const { id } = parse(idParam, req.params);
    const body = parse(updateUserSchema, req.body);
    const user = await getUser(id);
    if (body.role && body.role !== user.role) {
      if (user.is_demo) throw forbidden('The demo accounts keep their roles');
      if (user.role === 'admin' && (await adminCount()) <= 1) {
        throw badRequest('There must be at least one admin');
      }
    }
    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role) WHERE id = ?',
      [body.name ?? null, body.role ?? null, id],
    );
    const updated = await getUser(id);
    res.json({ user: { ...toPublicUser(updated), isDemo: updated.is_demo === 1 } });
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parse(idParam, req.params);
    if (id === req.user?.id) throw badRequest('You cannot delete your own account');
    const user = await getUser(id);
    if (user.is_demo) throw forbidden('The demo accounts cannot be deleted');
    if (user.role === 'admin' && (await adminCount()) <= 1) {
      throw badRequest('There must be at least one admin');
    }
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(204).end();
  });

  return router;
}
