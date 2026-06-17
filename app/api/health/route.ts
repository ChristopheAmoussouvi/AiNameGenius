import { ok } from "@/lib/api/response"

export async function GET() {
  return ok({
    service: "ainamegenius-api",
    status: "healthy",
    timestamp: new Date().toISOString(),
  })
}
