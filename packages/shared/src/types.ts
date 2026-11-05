import type { Role } from './constants.ts';
import type { Interval } from './dates.ts';

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface KpiValue {
  current: number;
  previous: number;
  /** Percent change, or points for rates. Null when there is nothing to compare. */
  change: number | null;
}

export interface KpisResponse {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  revenue: KpiValue;
  orders: KpiValue;
  averageOrderValue: KpiValue;
  returningRate: KpiValue;
}

export interface SalesPoint {
  /** First day of the bucket, YYYY-MM-DD in store time. */
  bucket: string;
  revenue: number;
  orders: number;
}

export interface SalesResponse {
  interval: Interval;
  current: SalesPoint[];
  previous: SalesPoint[];
}

export interface ProductRow {
  productId: number;
  title: string;
  category: string;
  units: number;
  revenue: number;
  refunds: number;
  /** Share of revenue in the range, 0 to 100. */
  share: number;
}

export interface CustomersPoint {
  bucket: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface CustomersResponse {
  interval: Interval;
  series: CustomersPoint[];
  totals: {
    customers: number;
    newCustomers: number;
    returningCustomers: number;
    /** Share of customers in the range with 2+ orders in the range, 0 to 100. */
    repeatRate: number;
  };
}

export interface TopCustomerRow {
  customerId: number;
  name: string;
  email: string;
  orders: number;
  revenue: number;
  lastOrderAt: string;
}

export interface OrderRow {
  id: number;
  number: string;
  createdAt: string;
  customerName: string;
  channel: string;
  status: string;
  items: number;
  total: number;
}

export interface OrdersResponse {
  rows: OrderRow[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
