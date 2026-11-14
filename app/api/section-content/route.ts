import { NextResponse } from "next/server"
import { fetchContent } from "@/lib/porto-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const content = await fetchContent<Record<string, unknown>>("section-content")
    return NextResponse.json(content, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "Section content is unavailable" }, { status: 502 })
  }
}
