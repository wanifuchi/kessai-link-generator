'use client';

import { JourneyStageKey, stageLabels, StageKeywordSet } from '@/data/funeralKeywords';
import { cn } from '@/lib/utils';

type StageTimelineNavProps = {
  stages: StageKeywordSet[];
  activeStage: JourneyStageKey;
  onStageChange: (stage: JourneyStageKey) => void;
};

export function StageTimelineNav({ stages, activeStage, onStageChange }: StageTimelineNavProps) {
  const activeLabel = stageLabels[activeStage] ?? '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          ライフイベントタイムライン
        </h2>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 px-3 py-1">
            全{stages.length}ステージ
          </span>
          <span className="rounded-full border border-slate-200 px-3 py-1">
            選択中: {activeLabel || '—'}
          </span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-stretch md:gap-4">
        {stages.map((stage, index) => {
          const isActive = stage.stage === activeStage;
          return (
            <button
              key={stage.stage}
              type="button"
              onClick={() => onStageChange(stage.stage)}
              className={cn(
                'group relative flex-1 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                'border-slate-200 bg-slate-50/80 hover:bg-white',
                isActive ? 'border-primary/60 bg-white shadow-md' : undefined,
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stage {index + 1}
                </span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full border border-slate-300 transition',
                    isActive ? 'border-primary bg-primary' : 'bg-slate-200',
                  )}
                />
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {stage.timeframe}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {stage.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
