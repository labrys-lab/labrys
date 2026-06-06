"use client";

import { useRouter } from "next/navigation";
import ScenarioCard from "@/components/ScenarioCard";
import { SCENARIOS } from "@/lib/scenarios";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">SOC Lab</h1>
          <p className="text-gray-400 text-lg">Select a scenario to begin</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => router.push(`/scenario/${scenario.id}`)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
