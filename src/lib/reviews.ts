import { apiFetch } from './api';

export type Review = {
  id: string;
  note: number;
  commentaire?: string | null;
  cree_le?: string;
  client_nom?: string;
};

export async function fetchReviewsForEnterprise(enterpriseId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/enterprises/${enterpriseId}/reviews`, { method: 'GET' });
}

export async function submitReview(token: string, enterpriseId: string, note: number, commentaire?: string): Promise<Review> {
  return apiFetch<Review>(`/api/enterprises/${enterpriseId}/reviews`, { method: 'POST', token, jsonBody: { note, commentaire } });
}
