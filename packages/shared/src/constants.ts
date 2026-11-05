/*
 * Plain constants shared by the API and the web app. No zod here, so the
 * browser can import these without downloading the validation library.
 */

export const ROLES = ['admin', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ['paid', 'refunded', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CHANNELS = ['online', 'mobile', 'social'] as const;
export type Channel = (typeof CHANNELS)[number];

/** Longest range a report accepts, so one request cannot scan years of data. */
export const MAX_RANGE_DAYS = 731;

export const INTERVALS = ['day', 'week', 'month'] as const;

export const PRODUCT_SORTS = ['revenue', 'units', 'refunds', 'title'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const EXPORT_REPORTS = ['orders', 'products', 'customers'] as const;
export type ExportReport = (typeof EXPORT_REPORTS)[number];
