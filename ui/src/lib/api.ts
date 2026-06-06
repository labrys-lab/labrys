import type { ScenarioResponse, StatusResponse } from "@/types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

export async function startScenario(name: string): Promise<ScenarioResponse> {
  return request<ScenarioResponse>(`/scenario/${name}/start`, { method: "POST" });
}

export async function stopScenario(name: string): Promise<ScenarioResponse> {
  return request<ScenarioResponse>(`/scenario/${name}/stop`, { method: "POST" });
}

export async function resetScenario(name: string): Promise<ScenarioResponse> {
  return request<ScenarioResponse>(`/scenario/${name}/reset`, { method: "POST" });
}

export async function getScenarioStatus(name: string): Promise<StatusResponse> {
  return request<StatusResponse>(`/scenario/${name}/status`);
}
