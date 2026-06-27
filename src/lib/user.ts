// User / cookie helper. In this demo there is no real auth — every visitor
// gets a stable anonymous cookie that identifies their favorites & history.

import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE_NAME = 'iptv_uid';

export async function getCurrentUser(): Promise<{ id: string; cookie: string }> {
  const cookieStore = await cookies();
  let cookie = cookieStore.get(COOKIE_NAME)?.value;

  if (!cookie) {
    cookie = `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }

  let user = await db.user.findUnique({ where: { cookie } });
  if (!user) {
    user = await db.user.create({
      data: {
        cookie,
        name: 'Guest',
        role: 'viewer',
      },
    });
  }

  return { id: user.id, cookie };
}

export const USER_COOKIE_NAME = COOKIE_NAME;
