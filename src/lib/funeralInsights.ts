import {
  JourneyStageKey,
  ScenarioBlueprint,
  personaStageScenarios,
  StageKeywordSet,
} from '@/data/funeralKeywords';

export function getScenarioById(id: string): ScenarioBlueprint | undefined {
  return personaStageScenarios.find((scenario) => scenario.id === id);
}

export function listScenarios(): ScenarioBlueprint[] {
  return personaStageScenarios;
}

export function getStageSets(
  scenario: ScenarioBlueprint,
  stageOrder?: JourneyStageKey[],
): StageKeywordSet[] {
  const order = stageOrder ?? scenario.defaultStageOrder;
  const keyed = scenario.stageSets.reduce<Record<JourneyStageKey, StageKeywordSet>>((map, stageSet) => {
    map[stageSet.stage] = stageSet;
    return map;
  }, {} as Record<JourneyStageKey, StageKeywordSet>);

  return order
    .map((stageKey) => keyed[stageKey])
    .filter((stageSet): stageSet is StageKeywordSet => Boolean(stageSet));
}

export const defaultScenarioId = personaStageScenarios[0]?.id ?? 'family-funeral';

export function getStageKeyFromLabel(label: string): JourneyStageKey | undefined {
  const scenario = personaStageScenarios[0];
  if (!scenario) return undefined;
  const stage = scenario.stageSets.find((set) => set.label === label || set.timeframe === label);
  return stage?.stage;
}
