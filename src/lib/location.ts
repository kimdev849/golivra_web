import { apiFetch } from "./api";

export type Pays = {
  id: string;
  nom: string;
  code_iso2: string;
  code_iso3: string;
  indicatif: string | null;
  phone_digits: number | null;
  phone_format: string | null;
};

export type Ville = {
  id: string;
  pays_id: string;
  nom: string;
  sort_order: number;
};

export type DetectResult = {
  ip: string;
  pays: Pays | null;
  villes: Ville[];
  detected_ville: string | null;
  ville_suggestion: Ville | null;
};

export async function fetchPays(): Promise<Pays[]> {
  const data = await apiFetch<Pays[]>("/api/locations/pays", { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function fetchVillesByPays(paysId: string): Promise<Ville[]> {
  const data = await apiFetch<Ville[]>(`/api/locations/villes/${paysId}`, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function detectLocation(): Promise<DetectResult> {
  return apiFetch<DetectResult>("/api/locations/detect", { method: "GET" });
}
