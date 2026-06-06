import type { AlertItem } from "@/types";

interface Props {
  alerts: AlertItem[];
  loading: boolean;
}

function levelBadgeClass(level: number): string {
  if (level >= 11) return "bg-red-500/20 text-red-400";
  if (level >= 6) return "bg-yellow-500/20 text-yellow-400";
  return "bg-green-500/20 text-green-400";
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export default function AlertFeed({ alerts, loading }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Alert Feed
      </p>

      {loading && alerts.length === 0 && (
        <p className="text-yellow-400 text-sm animate-pulse">
          Waiting for alerts...
        </p>
      )}

      {!loading && alerts.length === 0 && (
        <p className="text-gray-500 text-sm">
          No alerts yet — start the lab and execute the attack
        </p>
      )}

      {alerts.length > 0 && (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="border-b border-gray-800 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-gray-200 text-sm flex-1">
                  {alert.rule.description}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${levelBadgeClass(
                    alert.rule.level
                  )}`}
                >
                  Level {alert.rule.level}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-500 text-xs">{alert.agent.name}</span>
                <span className="text-gray-600 text-xs">
                  {formatTs(alert.timestamp)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
