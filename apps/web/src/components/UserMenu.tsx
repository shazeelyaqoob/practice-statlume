import type { PublicUser } from '@statlume/shared';
import { apiGet } from '@/lib/api';
import { LogoutButton } from './LogoutButton';

export async function UserMenu() {
  const { user } = await apiGet<{ user: PublicUser }>('/auth/me');
  return (
    <div className="flex items-center gap-3">
      <div className="text-right text-sm leading-tight max-sm:hidden">
        <p className="font-semibold">{user.name}</p>
        <p className="text-muted capitalize">{user.role}</p>
      </div>
      <LogoutButton />
    </div>
  );
}
