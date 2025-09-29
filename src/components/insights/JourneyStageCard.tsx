'use client';

import { StageKeywordSet, intentLabels } from '@/data/funeralKeywords';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { KeywordTag } from './KeywordTag';
import { Sparkles, TrendingUp } from 'lucide-react';

type JourneyStageCardProps = {
  stage: StageKeywordSet;
  isActive?: boolean;
};

type KeywordListProps = {
  title: string;
  items: StageKeywordSet['topKeywords'];
  highlightRising?: boolean;
};

function KeywordList({ title, items, highlightRising }: KeywordListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        {highlightRising ? <TrendingUp className="h-4 w-4 text-rose-500" /> : <Sparkles className="h-4 w-4 text-slate-500" />}
        <span>{title}</span>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.keyword}
            className={cn(
              'rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300',
              highlightRising && item.rising ? 'border-rose-200 bg-rose-50/60' : undefined,
            )}
          >
            <p className="text-sm font-medium text-slate-800">{item.keyword}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.map((intent) => (
                <KeywordTag key={`${item.keyword}-${intent}`} intent={intent} />
              ))}
            </div>
            {item.rationale && (
              <p className="mt-2 text-xs text-slate-500">{item.rationale}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JourneyStageCard({ stage, isActive }: JourneyStageCardProps) {
  return (
    <Card
      className={cn(
        'h-full border-slate-200 bg-slate-50/70 shadow-none transition',
        isActive ? 'border-primary/50 bg-white shadow-md ring-1 ring-primary/20' : undefined,
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base text-slate-900">
              {stage.label}
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              {stage.timeframe}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white text-xs text-slate-600">
            {stage.dominantIntents.map((intent) => intentLabels[intent]).join(' / ')}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          {stage.description}
        </p>
        <Separator className="bg-slate-200" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            フォーカス課題
          </p>
          <ul className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            {stage.primaryQuestions.map((question) => (
              <li key={question} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                {question}
              </li>
            ))}
          </ul>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <KeywordList title="主要キーワード" items={stage.topKeywords} />
        <KeywordList title="伸びているキーワード" items={stage.emergingKeywords} highlightRising />
      </CardContent>
    </Card>
  );
}
