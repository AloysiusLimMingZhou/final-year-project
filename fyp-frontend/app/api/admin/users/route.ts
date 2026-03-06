import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req: Request) {
  const backend = process.env.BACKEND_URL;
  if (!backend) return { ok: false, status: 500, error: "Missing BACKEND_URL in .env.local" as const };

  const meRes = await fetch(`${backend}/api/auth/profile`, {
    headers: {
      Cookie: req.headers.get("cookie") ?? "",
      Authorization: req.headers.get("authorization") ?? "",
    },
    cache: "no-store",
  });

  if (!meRes.ok) return { ok: false, status: 401, error: "Unauthorized" as const, backend };

  const me = await meRes.json();
  const roles: string[] = Array.isArray(me?.roles) ? me.roles : [];
  const isAdmin = roles.some((r) => String(r).toLowerCase() === "admin");
  if (!isAdmin) return { ok: false, status: 403, error: "Forbidden" as const, backend };

  return { ok: true, backend: backend as string };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const candidates = [
    `${gate.backend}/api/admin/users`,
    `${gate.backend}/admin/users`,
    `${gate.backend}/api/users`, // fallback if your backend doesn't have /admin/users yet
    `${gate.backend}/users`,
  ];

  const errors: any[] = [];

  for (const target of candidates) {
    try {
      const upstream = await fetch(target, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") ?? "",
          Authorization: req.headers.get("authorization") ?? "",
        },
        cache: "no-store",
      });

      const text = await upstream.text();

      if (!upstream.ok) {
        errors.push({ target, status: upstream.status, body: text.slice(0, 250) });
        continue;
      }

      try {
        return NextResponse.json(JSON.parse(text));
      } catch {
        return NextResponse.json({ raw: text, target });
      }
    } catch (e: any) {
      errors.push({ target, error: e?.message ?? String(e) });
    }
  }

  return NextResponse.json(
    { error: "No matching backend users endpoint found", tried: candidates, details: errors },
    { status: 502 }
  );
}