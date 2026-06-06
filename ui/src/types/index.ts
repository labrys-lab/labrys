export type ScenarioId =
  | "kerberoasting"
  | "pass-the-hash"
  | "dcsync"
  | "brute-force"
  | "port-scan"
  | "sqli-lfi";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type LabStatus = "idle" | "starting" | "ready" | "running" | "success";

export interface ScenarioMeta {
  id: ScenarioId;
  name: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  description: string;
  tags: string[];
}

export interface ScenarioResponse {
  status: string;
  scenario: string;
  message?: string;
}

export interface StatusResponse {
  status: "success" | "running" | "idle";
  scenario: string;
  alert?: Record<string, unknown> | null;
}

export interface AlertItem {
  id: string;
  rule: { id: string; description: string; level: number };
  agent: { name: string };
  timestamp: string;
}
