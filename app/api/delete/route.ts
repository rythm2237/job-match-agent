import { NextResponse } from "next/server";
import { db } from "@/lib/server";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.length < 32) return new NextResponse("Invalid deletion link.", { status: 400 });
  const database = db();
  const { data: subscriber, error: lookupError } = await database.from("subscribers").select("id").eq("unsubscribe_token", token).maybeSingle();
  if (lookupError || !subscriber) return new NextResponse("Account not found.", { status: 404 });
  const { error } = await database.from("subscribers").delete().eq("id", subscriber.id);
  if (error) return new NextResponse("Could not delete your data. Please try again.", { status: 500 });
  return new NextResponse("Your Job Match Agent profile and notification history have been deleted.", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
