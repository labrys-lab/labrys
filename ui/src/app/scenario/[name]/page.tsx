"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getScenarioStatus, startScenario } from "@/lib/api";
import { SCENARIOS } from "@/lib/scenarios";
import AlertFeed from "@/components/AlertFeed";
import AttackGuide from "@/components/AttackGuide";
import ConnectionInfo from "@/components/ConnectionInfo";
import LabStatus from "@/components/LabStatus";
import ResetButton from "@/components/ResetButton";
import SuccessBanner from "@/components/SuccessBanner";
import type { AlertItem, LabStatus as LabStatusType } from "@/types";

interface PageProps {
  params: { name: string };
}

function parseAlertItem(raw: Record<string, unknown>): AlertItem {
  const rule = raw.rule as
    | { id?: string; description?: string; level?: number }
    | undefined;
  const agent = raw.agent as { name?: string } | undefined;
  return {
    id:
      (raw._id as string) ||
      (raw.id as string) ||
      String(Date.now() + Math.random()),
    rule: {
      id: rule?.id ?? "",
      description: rule?.description ?? "Alert detected",
      level: rule?.level ?? 0,
    },
    agent: { name: agent?.name ?? "unknown" },
    timestamp: (raw.timestamp as string) || new Date().toISOString(),
  };
}

export default function ScenarioPage({ params }: PageProps) {
  const router = useRouter();
  const scenario = SCENARIOS.find((s) => s.id === params.name);

  const [labStatus, setLabStatus] = useState<LabStatusType>("idle");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [successAlert, setSuccessAlert] =
    useState<Record<string, unknown> | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!scenario) router.replace("/");
  }, [scenario, router]);

  const addAlertFromRaw = useCallback((raw: Record<string, unknown>) => {
    const item = parseAlertItem(raw);
    setAlerts((prev) => {
      if (prev.some((a) => a.id === item.id)) return prev;
      return [item, ...prev].slice(0, 10);
    });
  }, []);

  // Poll Wazuh status every 3s while lab is active
  useEffect(() => {
    if (labStatus === "idle") return;

    const id = setInterval(async () => {
      try {
        const res = await getScenarioStatus(params.name);
        if (res.status === "success") {
          setLabStatus("success");
          if (res.alert) {
            const raw = res.alert as Record<string, unknown>;
            addAlertFromRaw(raw);
            setSuccessAlert(raw);
          }
        } else if (res.status === "running") {
          setLabStatus((prev) =>
            prev === "success" ? "success" : "running"
          );
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }
    }, 3000);

    return () => clearInterval(id);
  }, [labStatus, params.name, addAlertFromRaw]);

  if (!scenario) return null;

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startScenario(params.name);
      setLabStatus("starting");
    } catch (err) {
      console.error("Start error:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleReset = () => {
    setLabStatus("idle");
    setAlerts([]);
    setSuccessAlert(null);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5
            bg-gray-800 hover:bg-gray-700 rounded"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold">{scenario.name}</h1>
          <p className="text-xs text-gray-500">
            {scenario.difficulty} · ~{scenario.estimatedMinutes}m
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: LabStatus + ConnectionInfo + AttackGuide */}
          <div className="space-y-4">
            <LabStatus status={labStatus} />
            <ConnectionInfo scenarioName={params.name} status={labStatus} />
            <AttackGuide scenarioName={params.name} />
          </div>

          {/* Right: AlertFeed + SuccessBanner */}
          <div className="space-y-4">
            {labStatus === "success" && (
              <SuccessBanner alert={successAlert} />
            )}
            <AlertFeed
              alerts={alerts}
              loading={
                labStatus === "starting" || labStatus === "running"
              }
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-6 flex items-center gap-4">
          {labStatus === "idle" && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium
                rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center gap-2"
            >
              {isStarting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isStarting ? "Starting..." : "Start Lab"}
            </button>
          )}
          <ResetButton scenarioName={params.name} onReset={handleReset} />
        </div>
      </div>
    </div>
  );
}
