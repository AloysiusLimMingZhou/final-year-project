export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const DEFAULT_RAG_URL = "http://127.0.0.1:8001/chat";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ragUrl = process.env.RAG_URL ?? DEFAULT_RAG_URL;

    const upstream = await fetch(ragUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}: ${text}` },
        { status: upstream.status }
      );
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ answer: text, citation: [] });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `Proxy error: ${err?.message ?? String(err)}` },
      { status: 500 }
    );
  }
}
