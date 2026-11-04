export interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/products', label: 'Products' },
  { href: '/customers', label: 'Customers' },
  { href: '/orders', label: 'Orders' },
  { href: '/users', label: 'Users', adminOnly: true },
];

/** Keeps the chosen date range when moving between pages. */
export function withRange(href: string, from: string | null, to: string | null): string {
  if (!from || !to) return href;
  return `${href}?from=${from}&to=${to}`;
}
