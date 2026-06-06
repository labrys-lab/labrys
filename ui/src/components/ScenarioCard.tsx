import type { ScenarioMeta } from "@/types";

interface Props {
  scenario: ScenarioMeta;
  onClick: () => void;
}

const difficultyStyle: Record<string, string> = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ScenarioCard({ scenario, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-700 rounded-lg p-6 cursor-pointer
        hover:border-blue-500 hover:scale-[1.02] transition-all duration-200
        hover:shadow-lg hover:shadow-blue-500/10"
    >
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold text-white">{scenario.name}</h2>
        <span
          className={`text-xs px-2 py-1 rounded border flex-shrink-0 ml-2 ${
            difficultyStyle[scenario.difficulty]
          }`}
        >
          {scenario.difficulty}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
        {scenario.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {scenario.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
          ~{scenario.estimatedMinutes}m
        </span>
      </div>
    </div>
  );
}
