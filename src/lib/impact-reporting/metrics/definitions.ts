/**
 * Canonical impact metric definitions derived from the Personal Wellbeing Index
 * Client Tracker "Guide" sheet. The array order matches the left-to-right column
 * order of the "Data Entry" sheet, which the importer relies on to map columns to
 * metrics.
 *
 * These seed the `impact_metric_definition` table so scoring rules are
 * configurable data rather than hard-coded spreadsheet formulas.
 */
export const PERSONAL_WELLBEING_INDEX_LABEL = "Personal Wellbeing Index";

export const PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL =
  `${PERSONAL_WELLBEING_INDEX_LABEL} Client Tracker`;

export type MetricCategory = "pwi" | "wellbeing" | "work_readiness";

export type ScaleType = "0-10" | "1-5" | "1-4";

export type MetricDefinitionSeed = {
  key: string;
  label: string;
  fullQuestion: string;
  domain: string;
  category: MetricCategory;
  scaleType: ScaleType;
  scaleMin: number;
  scaleMax: number;
  missingValues: (string | number)[];
  higherIsBetter: boolean;
};

export const METRIC_DEFINITIONS: MetricDefinitionSeed[] = [
  {
    key: "life_overall",
    label: "Life Overall",
    fullQuestion: "How satisfied are you with your life as a whole?",
    domain: "Life Overall",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "standard_of_living",
    label: "Standard of Living",
    fullQuestion: "How satisfied are you with your standard of living?",
    domain: "Standard of Living",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "health",
    label: "Health",
    fullQuestion: "How satisfied are you with your health?",
    domain: "Health",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "achieving_in_life",
    label: "Achieving in Life",
    fullQuestion:
      "How satisfied are you with what you are achieving in life?",
    domain: "Achieving in Life",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "personal_relationships",
    label: "Personal Relationships",
    fullQuestion: "How satisfied are you with your personal relationships?",
    domain: "Personal Relationships",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "safety",
    label: "Safety",
    fullQuestion: "How satisfied are you with how safe you feel?",
    domain: "Safety",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "community",
    label: "Community",
    fullQuestion:
      "How satisfied are you with feeling part of your community?",
    domain: "Community",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "future_security",
    label: "Future Security",
    fullQuestion: "How satisfied are you with your future security?",
    domain: "Future Security",
    category: "pwi",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "financial_worry",
    label: "Financial Worry",
    fullQuestion:
      "To what extent, if at all, do you worry about your financial situation?",
    domain: "Financial Worry",
    category: "wellbeing",
    scaleType: "1-4",
    scaleMin: 1,
    scaleMax: 4,
    // 5 = "Don't know" is treated as missing in analysis (per the Guide).
    missingValues: [5, "Don't know", "Dont know"],
    higherIsBetter: true,
  },
  {
    key: "self_confidence",
    label: "Self-Confidence",
    fullQuestion: "How do you usually feel about yourself? (Shame to Confidence)",
    domain: "Self-Confidence",
    category: "wellbeing",
    scaleType: "1-5",
    scaleMin: 1,
    scaleMax: 5,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "voice_agency",
    label: "Voice & Agency",
    fullQuestion: "How do you usually feel about expressing yourself?",
    domain: "Voice & Agency",
    category: "wellbeing",
    scaleType: "1-5",
    scaleMin: 1,
    scaleMax: 5,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "work_readiness",
    label: "Work Readiness",
    fullQuestion: "I feel ready and willing to work.",
    domain: "Work Readiness",
    category: "work_readiness",
    scaleType: "1-5",
    scaleMin: 1,
    scaleMax: 5,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "career_confidence",
    label: "Career Confidence",
    fullQuestion:
      "On a scale of 1 to 10, how confident do you feel about the career paths available to you?",
    domain: "Career Confidence",
    category: "work_readiness",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
  {
    key: "skills_awareness",
    label: "Skills Awareness",
    fullQuestion:
      "On a scale of 1 to 10, how well do you understand how your skills can be applied to future jobs or training?",
    domain: "Skills Awareness",
    category: "work_readiness",
    scaleType: "0-10",
    scaleMin: 0,
    scaleMax: 10,
    missingValues: [],
    higherIsBetter: true,
  },
];

export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  pwi: PERSONAL_WELLBEING_INDEX_LABEL,
  wellbeing: "Wellbeing & confidence",
  work_readiness: "Work readiness",
};

export function metricByKey(key: string): MetricDefinitionSeed | undefined {
  return METRIC_DEFINITIONS.find((m) => m.key === key);
}
