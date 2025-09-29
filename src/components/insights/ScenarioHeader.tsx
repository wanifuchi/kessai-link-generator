'use client';

import {
  personaLabels,
  ScenarioBlueprint,
} from '@/data/funeralKeywords';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export type ScenarioHeaderProps = {
  scenario: ScenarioBlueprint;
};

export function ScenarioHeader({ scenario }: ScenarioHeaderProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            シナリオ
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {scenario.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-2 bg-slate-100 text-slate-700">
            <Users className="h-4 w-4" />
            想定ペルソナ
          </Badge>
          {scenario.personas.map((persona) => (
            <Badge key={persona} variant="outline" className="border-slate-300 text-slate-700">
              {personaLabels[persona]}
            </Badge>
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        {scenario.description}
      </p>
    </div>
  );
}
