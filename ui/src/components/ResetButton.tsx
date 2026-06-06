"use client";

import { useState } from "react";
import { resetScenario } from "@/lib/api";

interface Props {
  scenarioName: string;
  onReset: () => void;
}

export default function ResetButton({ scenarioName, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleFirstClick = () => setConfirming(true);

  const handleConfirm = async () => {
    setResetting(true);
    try {
      await resetScenario(scenarioName);
      onReset();
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setResetting(false);
      setConfirming(false);
    }
  };

  const handleCancel = () => setConfirming(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-300 text-sm">
          Reset lab? This will stop all containers.
        </span>
        <button
          onClick={handleConfirm}
          disabled={resetting}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded
            disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {resetting && (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Confirm Reset
        </button>
        <button
          onClick={handleCancel}
          disabled={resetting}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm
            rounded disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleFirstClick}
      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400
        border border-red-600/30 hover:border-red-500 text-sm rounded transition-colors"
    >
      Reset Lab
    </button>
  );
}
