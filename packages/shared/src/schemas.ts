import { z } from 'zod';
import { daysInRange, isIsoDate } from './dates.ts';

export const ROLES = ['admin', 'viewer'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const ORDER_STATUSES = ['paid', 'refunded', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const CHANNELS = ['online', 'mobile', 'social'] as const;
export type Channel = (typeof CHANNELS)[number];

/** Longest range a report accepts, so one request cannot scan years of data. */
export const MAX_RANGE_DAYS = 731;

const isoDate = z.string().refine(isIsoDate, { message: 'Use the format YYYY-MM-DD' });

function withRangeChecks<T extends z.ZodType<{ from: string; to: string }>>(schema: T) {
  return schema
    .refine((r) => r.from <= r.to, { message: '`from` must be on or before `to`', path: ['from'] })
    .refine((r) => daysInRange(r.from, r.to) <= MAX_RANGE_DAYS, {
      message: `Range can be at most ${MAX_RANGE_DAYS} days`,
      path: ['to'],
    });
}

export const dateRangeSchema = withRangeChecks(z.object({ from: isoDate, to: isoDate }));
export type DateRange = z.infer<typeof dateRangeSchema>;

export const INTERVALS = ['day', 'week', 'month'] as const;

export const salesQuerySchema = withRangeChecks(
  z.object({ from: isoDate, to: isoDate, interval: z.enum(INTERVALS).optional() }),
);

export const PRODUCT_SORTS = ['revenue', 'units', 'refunds', 'title'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const productsQuerySchema = withRangeChecks(
  z.object({
    from: isoDate,
    to: isoDate,
    sort: z.enum(PRODUCT_SORTS).default('revenue'),
    dir: z.enum(['asc', 'desc']).default('desc'),
    q: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
);
export type ProductsQuery = z.infer<typeof productsQuerySchema>;

export const topCustomersQuerySchema = withRangeChecks(
  z.object({
    from: isoDate,
    to: isoDate,
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
);

export const ordersQuerySchema = withRangeChecks(
  z.object({
    from: isoDate,
    to: isoDate,
    status: z.enum(ORDER_STATUSES).optional(),
    channel: z.enum(CHANNELS).optional(),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(10).max(100).default(25),
  }),
);
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

const email = z
  .email()
  .max(190)
  .transform((e) => e.toLowerCase());

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});

export const demoLoginSchema = z.object({ role: roleSchema });

export const createUserSchema = z.object({
  email,
  name: z.string().trim().min(1).max(100),
  role: roleSchema,
  password: z.string().min(10, 'Use at least 10 characters').max(200),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    role: roleSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.role !== undefined, { message: 'Nothing to update' });

export const EXPORT_REPORTS = ['orders', 'products', 'customers'] as const;
export type ExportReport = (typeof EXPORT_REPORTS)[number];
