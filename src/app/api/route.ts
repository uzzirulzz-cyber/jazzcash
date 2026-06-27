import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

// GET /api — health check + ensure database is seeded.
export async function GET() {
  await ensureSeeded();
  return NextResponse.json({
    message: "IPTV Sports Streaming Platform API",
    status: "ok",
    docs: ["/api/playlists", "/api/channels", "/api/categories", "/api/home", "/api/analytics", "/api/search", "/api/favorites", "/api/history"],
  });
}
