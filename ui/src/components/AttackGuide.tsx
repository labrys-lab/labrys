"use client";

import { useEffect, useState } from "react";

interface Props {
  scenarioName: string;
}

interface Step {
  index: number;
  text: string;
  command?: string;
}

export default function AttackGuide({ scenarioName }: Props) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchGuide = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/scenario/${scenarioName}/guide`);
        if (cancelled) return;
        if (!res.ok) {
          setSteps(null);
          return;
        }
        const data = (await res.json()) as { steps?: Step[] };
        if (!cancelled) setSteps(data.steps ?? null);
      } catch {
        if (!cancelled) setSteps(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGuide();
    return () => {
      cancelled = true;
    };
  }, [scenarioName]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Attack Guide
      </p>

      {loading && (
        <p className="text-gray-500 text-sm animate-pulse">Loading...</p>
      )}

      {!loading && !steps && (
        <p className="text-gray-500 text-sm">
          Attack guide will appear when lab is ready.
        </p>
      )}

      {!loading && steps && (
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center justify-center font-bold">
                {step.index}
              </span>
              <div className="flex-1">
                <p className="text-gray-200 text-sm mb-1">{step.text}</p>
                {step.command && (
                  <code className="block bg-gray-950 text-green-400 px-3 py-2 rounded text-sm font-mono">
                    {step.command}
                  </code>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
