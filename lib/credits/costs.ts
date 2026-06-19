// Credit cost per billable action.
export const CREDIT_COSTS = {
  name_generation: 1,
  brand_kit: 5,
  logo_regen: 3,
  pdf_report: 2,
} as const

export type BillableAction = keyof typeof CREDIT_COSTS
