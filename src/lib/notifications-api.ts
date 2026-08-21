import { apiFetch } from './api';
import type { Notification } from './types';

export async function fetchNotifications(token: string): Promise<Notification[]> {
  return apiFetch<Notification[]>('/api/notifications', { method: 'GET', token });
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const data = await apiFetch<{ count: number }>('/api/notifications/unread-count', { method: 'GET', token });
  return data?.count ?? 0;
}

export async function markNotificationRead(token: string, id: string): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH', token, jsonBody: {} });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await apiFetch('/api/notifications/read-all', { method: 'PATCH', token, jsonBody: {} });
}
