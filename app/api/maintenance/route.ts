import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  const { data: modeData } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "maintenance_mode")
    .single()

  const { data: msgData } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "maintenance_message")
    .single()

  return NextResponse.json({
    maintenance: modeData?.value === "true",
    message: msgData?.value || "We are currently performing scheduled maintenance.",
  })
}

export async function POST(request: Request) {
  const { enabled, message } = await request.json()
  const supabase = createClient()

  // Update mode
  const { error: modeError } = await supabase
    .from("site_settings")
    .update({ value: enabled ? "true" : "false" })
    .eq("key", "maintenance_mode")

  if (modeError) {
    return NextResponse.json({ error: modeError.message }, { status: 500 })
  }

  // Update message (kalau ada)
  if (message !== undefined) {
    const { error: msgError } = await supabase
      .from("site_settings")
      .update({ value: message })
      .eq("key", "maintenance_message")

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set("maintenance_mode", enabled ? "true" : "false", {
    httpOnly: true,
    path: "/",
    maxAge: enabled ? 60 * 60 * 24 * 30 : 0,
  })

  return response
}
