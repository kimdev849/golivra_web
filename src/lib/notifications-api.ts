import { apiFetch } from './api';
import type { Notification } from './types';

export async function fetchNotifications(token: string): Promise<Notification[]> {
  const data = await apiFetch<{ items?: Notification[]; unread_count?: number } | Notification[]>('/api/notifications?limit=50', { method: 'GET', token });
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const data = await apiFetch<{ unread_count?: number; count?: number }>('/api/notifications/unread-count', { method: 'GET', token });
  const count = data?.unread_count ?? data?.count ?? 0;
  return Number(count) || 0;
}

export async function markNotificationRead(token: string, id: string): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH', token, jsonBody: {} });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await apiFetch('/api/notifications/read-all', { method: 'PATCH', token, jsonBody: {} });
}
