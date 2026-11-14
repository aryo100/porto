import { assetUrl } from "@/lib/porto-service"

export const dynamic = "force-dynamic"

export async function GET() {
  const response = await fetch(assetUrl("/api/v1/settings/cv"), { cache: "no-store" })
  if (!response.ok) return new Response("CV unavailable", { status: 502 })
  return new Response(response.body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=\"CV.pdf\"", "Cache-Control": "no-store" } })
}
