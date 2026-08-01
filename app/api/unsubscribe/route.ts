import { NextResponse } from "next/server";
import { db } from "@/lib/server";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.length < 32) return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  const { error } = await db().from("subscribers").update({ active: false, updated_at: new Date().toISOString() }).eq("unsubscribe_token", token);
  if (error) return new NextResponse("Could not unsubscribe. Please try again.", { status: 500 });
  return new NextResponse("You have been unsubscribed from Job Match Agent emails.", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
