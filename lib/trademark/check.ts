import { checkTrademarkInpi, type TrademarkRisk, type TrademarkHit } from "./inpi"

export type { TrademarkRisk }

export type TrademarkCheckResult = {
  name: string
  risk: TrademarkRisk
  total: number
  hits: TrademarkHit[]
  source: "inpi" | "none"
}

export async function checkTrademark(name: string): Promise<TrademarkCheckResult> {
  const result = await checkTrademarkInpi(name)
  return { name, ...result, source: result.source === "inpi" ? "inpi" : "none" }
}

export async function checkTrademarks(names: string[]): Promise<TrademarkCheckResult[]> {
  return Promise.all(names.map(checkTrademark))
}
