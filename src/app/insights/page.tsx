'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  JourneyStageKey,
  personaLabels,
  stageLabels,
} from '@/data/funeralKeywords';
import {
  defaultScenarioId,
  getScenarioById,
  getStageSets,
  listScenarios,
} from '@/lib/funeralInsights';
import { StageTimelineNav } from '@/components/insights/StageTimelineNav';
import { JourneyStageCard } from '@/components/insights/JourneyStageCard';
import { ScenarioHeader } from '@/components/insights/ScenarioHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

const scenarios = listScenarios();

export default function InsightsPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    defaultScenarioId,
  );

  const scenario = useMemo(() => {
    const found = getScenarioById(selectedScenarioId);
    return found ?? scenarios[0];
  }, [selectedScenarioId]);

  const stages = useMemo(() => {
    if (!scenario) return [];
    return getStageSets(scenario);
  }, [scenario]);

  const [activeStage, setActiveStage] = useState<JourneyStageKey>(
    stages[0]?.stage ?? scenario?.defaultStageOrder[0] ?? 'sixToThreeMonthsBefore',
  );

  useEffect(() => {
    if (!stages.some((stage) => stage.stage === activeStage)) {
      const fallback = stages[0]?.stage ?? scenario.defaultStageOrder[0];
      if (fallback) {
        setActiveStage(fallback);
      }
    }
  }, [stages, activeStage, scenario.defaultStageOrder]);

  if (!scenario) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-slate-600">シナリオデータを読み込めませんでした。</p>
      </div>
    );
  }

  const activeStageDetails = stages.find((stage) => stage.stage === activeStage);

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            インサイト
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            葬儀・エンディング領域の検索インサイト
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            ユーザーが起点日を迎える前後の半年間で検索しがちなキーワードと、意思決定までの課題をタイムラインで把握できます。
          </p>
        </div>
        <div className="w-full max-w-xs">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            シナリオ選択
          </label>
          <Select
            value={scenario.id}
            onValueChange={(value) => {
              setSelectedScenarioId(value);
            }}
          >
            <SelectTrigger className="mt-1 bg-white">
              <SelectValue placeholder="シナリオを選択" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScenarioHeader scenario={scenario} />

      <Card className="border-slate-200 bg-slate-50/80">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <Info className="mt-1 h-4 w-4 text-primary" />
              <p>
                想定ユーザーが自然言語で入力しそうなキーワードをステージ別に収録しています。<br />
                ペルソナごとの課題仮説と合わせて、コンテンツ企画や広告コピー作成に活用できます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {scenario.personas.map((persona) => (
                <Badge key={persona} variant="outline" className="border-primary/40 text-primary">
                  {personaLabels[persona]}
                </Badge>
              ))}
            </div>
          </div>
          <Separator className="bg-slate-200" />
          <StageTimelineNav
            stages={stages}
            activeStage={activeStage}
            onStageChange={setActiveStage}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {stages.map((stage) => (
          <JourneyStageCard
            key={stage.stage}
            stage={stage}
            isActive={stage.stage === activeStage}
          />
        ))}
      </div>

      {activeStageDetails && (
        <Card className="border-primary/40 bg-white">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Info className="h-4 w-4" />
              {stageLabels[activeStage]} の施策検討ポイント
            </div>
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              {activeStageDetails.primaryQuestions.map((question) => (
                <div
                  key={`summary-${question}`}
                  className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
                >
                  {question}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              * 実データ連携時には検索ボリューム推移と関連クエリを表示予定です。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
