"use client";

import { useState } from "react";
import type { LabStatus } from "@/types";

interface Props {
  scenarioName: string;
  status: LabStatus;
}

const ACTIVE: LabStatus[] = ["ready", "running", "success"];

export default function ConnectionInfo({ scenarioName, status }: Props) {
  const [copied, setCopied] = useState(false);

  if (!ACTIVE.includes(status)) return null;

  const kaliCommand = `docker exec -it soc-lab_${scenarioName}_kali_1 bash`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(kaliCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Connection Details
      </p>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Kali Terminal</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-950 text-green-400 px-3 py-2 rounded text-sm font-mono overflow-x-auto">
            {kaliCommand}
          </code>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded
              text-gray-300 transition-colors flex-shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-1">Wazuh Dashboard</p>
        <a
          href="/dashboards"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          Open Wazuh Dashboards →
        </a>
      </div>
    </div>
  );
}
