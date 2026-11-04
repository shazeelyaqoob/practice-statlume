import type { Metadata } from 'next';
import type { PublicUser } from '@statlume/shared';
import { PageHeader, Section } from '@/components/Section';
import { TableSkeleton } from '@/components/states';
import { apiGet } from '@/lib/api';
import { sessionRole } from '@/lib/session';
import { UsersManager } from './UsersManager';

export const metadata: Metadata = {
  title: 'Users',
  description: 'Add people to Statlume and choose who can manage users.',
};

export type UserRow = PublicUser & { isDemo: boolean };

async function UsersList() {
  const [{ rows }, { user }] = await Promise.all([
    apiGet<{ rows: UserRow[] }>('/users'),
    apiGet<{ user: PublicUser }>('/auth/me'),
  ]);
  return <UsersManager users={rows} currentUserId={user.id} />;
}

export default async function UsersPage() {
  // The API is the real guard (403 for viewers). This just shows a clear
  // message instead of an error box.
  if ((await sessionRole()) !== 'admin') {
    return (
      <>
        <PageHeader title="Users" />
        <div role="alert" className="panel grid gap-2 p-6">
          <p className="font-semibold">Only admins can manage users.</p>
          <p className="text-muted">
            You are logged in as a viewer. You can still see every report and export CSV files.
          </p>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Users">
        Admins can manage users. Viewers can see every report and export CSV.
      </PageHeader>
      <Section id="users" title="People with access" fallback={<TableSkeleton rows={4} />}>
        <UsersList />
      </Section>
    </>
  );
}
