import type { LabStatus } from "@/types";

interface Props {
  status: LabStatus;
}

const statusConfig: Record<
  LabStatus,
  { label: string; className: string }
> = {
  idle: { label: "Not Started", className: "text-gray-500" },
  starting: {
    label: "Starting...",
    className: "text-yellow-400 animate-pulse",
  },
  ready: { label: "Ready", className: "text-green-400" },
  running: {
    label: "Running",
    className: "text-blue-400 animate-pulse",
  },
  success: {
    label: "✓ Success",
    className: "text-green-400 font-bold",
  },
};

export default function LabStatus({ status }: Props) {
  const { label, className } = statusConfig[status];
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        Lab Status
      </p>
      <span className={`text-base ${className}`}>{label}</span>
    </div>
  );
}
