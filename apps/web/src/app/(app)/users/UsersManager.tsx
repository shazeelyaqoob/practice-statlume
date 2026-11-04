'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, type Role } from '@statlume/shared';
import { apiSend } from '@/lib/client-api';
import { formatStoreDate } from '@/lib/format';
import type { UserRow } from './page';

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const refresh = () => startTransition(() => router.refresh());

  async function run(id: number | 'new', action: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      setMessage({ tone: 'ok', text: ok });
      refresh();
      return true;
    } catch (err) {
      setMessage({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong',
      });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <p aria-live="polite" className="min-h-6 text-sm font-semibold">
        {message ? (
          <span className={message.tone === 'ok' ? 'text-tide' : 'text-sodium-text'}>
            {message.text}
          </span>
        ) : null}
      </p>

      <div className="panel overflow-hidden">
        <table className="rtable">
          <caption className="sr-only">Users</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Added</th>
              <th scope="col" className="r">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const locked = u.isDemo || u.id === currentUserId;
              return (
                <tr key={u.id}>
                  <td className="lead" data-label="Name">
                    <span className="block">
                      {u.name}
                      {u.id === currentUserId ? (
                        <span className="text-muted font-normal"> (you)</span>
                      ) : null}
                      {u.isDemo ? <span className="text-muted font-normal"> · demo</span> : null}
                    </span>
                    <span className="text-muted text-sm font-normal break-all">{u.email}</span>
                  </td>
                  <td data-label="Role">
                    <label htmlFor={`role-${u.id}`} className="sr-only">
                      Role for {u.name}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      className="field w-32 capitalize"
                      value={u.role}
                      disabled={locked || busyId !== null}
                      title={
                        locked ? 'Demo accounts and your own account keep their role' : undefined
                      }
                      onChange={(e) => {
                        const role = e.target.value as Role;
                        void run(
                          u.id,
                          () =>
                            apiSend(`/users/${u.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ role }),
                            }),
                          `${u.name} is now ${role === 'admin' ? 'an admin' : 'a viewer'}.`,
                        );
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num" data-label="Added">
                    {formatStoreDate(u.createdAt)}
                  </td>
                  <td className="r" data-label="">
                    {locked ? (
                      <span className="text-muted text-sm">Protected</span>
                    ) : (
                      <button
                        type="button"
                        className="btn-quiet hover:border-sodium-text hover:text-sodium-text"
                        disabled={busyId !== null}
                        onClick={() => {
                          setToDelete(u);
                          dialogRef.current?.showModal();
                        }}
                      >
                        Remove<span className="sr-only"> {u.name}</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form
        ref={formRef}
        className="panel grid gap-4 p-5 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget));
          const ok = await run(
            'new',
            () => apiSend('/users', { method: 'POST', body: JSON.stringify(data) }),
            `Added ${String(data.name)}.`,
          );
          if (ok) formRef.current?.reset();
        }}
      >
        <h3 className="text-lg font-extrabold md:col-span-2">Add a user</h3>
        <div>
          <label htmlFor="new-name" className="label">
            Name
          </label>
          <input
            id="new-name"
            name="name"
            required
            maxLength={100}
            className="field"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="new-email" className="label">
            Email
          </label>
          <input
            id="new-email"
            name="email"
            type="email"
            required
            maxLength={190}
            className="field"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="label">
            Password
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={200}
            className="field"
            autoComplete="new-password"
            aria-describedby="new-password-hint"
          />
          <p id="new-password-hint" className="text-muted mt-1 text-sm">
            At least 10 characters.
          </p>
        </div>
        <div>
          <label htmlFor="new-role" className="label">
            Role
          </label>
          <select id="new-role" name="role" className="field capitalize" defaultValue="viewer">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="btn-primary" disabled={busyId !== null}>
            {busyId === 'new' ? 'Adding…' : 'Add user'}
          </button>
        </div>
      </form>

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        onClose={() => setToDelete(null)}
        className="panel m-auto w-[min(26rem,calc(100vw-2rem))] p-6 backdrop:bg-ink/40"
      >
        <h3 id="confirm-title" className="text-lg font-extrabold">
          Remove {toDelete?.name}?
        </h3>
        <p className="text-muted mt-2">They will be signed out and lose access straight away.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="btn-quiet"
            autoFocus
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn border-sodium-text bg-sodium-text text-white hover:opacity-90"
            onClick={async () => {
              const user = toDelete;
              dialogRef.current?.close();
              if (user) {
                await run(
                  user.id,
                  () => apiSend(`/users/${user.id}`, { method: 'DELETE' }),
                  `Removed ${user.name}.`,
                );
              }
            }}
          >
            Remove
          </button>
        </div>
      </dialog>
    </div>
  );
}
