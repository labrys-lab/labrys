interface Props {
  alert: Record<string, unknown> | null;
}

export default function SuccessBanner({ alert }: Props) {
  if (!alert) return null;

  const rule = alert.rule as
    | { description?: string; level?: number }
    | undefined;

  return (
    <div
      className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
      style={{ animation: "slideIn 0.4s ease-out" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎯</span>
        <h3 className="text-green-400 font-bold text-lg">Attack Detected!</h3>
      </div>
      {rule?.description && (
        <p className="text-green-300 text-sm mb-2">{rule.description}</p>
      )}
      {rule?.level !== undefined && (
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
          Alert Level: {rule.level}
        </span>
      )}
    </div>
  );
}
