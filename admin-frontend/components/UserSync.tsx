'use client';

import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || synced.current) return;
    synced.current = true;

    (async () => {
      const token = await getToken();
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
      await fetch(`${base}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? '',
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || 'Admin',
        }),
      }).catch(() => {});
    })();
  }, [isLoaded, user]);

  return null;
}
