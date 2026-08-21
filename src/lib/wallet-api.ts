import { apiFetch } from './api';

export type WalletBalance = { solde: number; total_retraits: number; retraits_en_cours: number };

export async function fetchWalletBalance(token: string): Promise<WalletBalance> {
  return apiFetch<WalletBalance>('/api/wallet/balance', { method: 'GET', token });
}

export async function fetchWalletHistory(token: string): Promise<{ transactions: Record<string, unknown>[] }> {
  return apiFetch('/api/wallet/history', { method: 'GET', token });
}

export async function requestWithdrawal(token: string, montant: number, methode: string, details: Record<string, unknown>): Promise<{ id: string; montant: number; statut: string }> {
  return apiFetch('/api/wallet/withdraw', { method: 'POST', token, jsonBody: { montant, methode, ...details } });
}
