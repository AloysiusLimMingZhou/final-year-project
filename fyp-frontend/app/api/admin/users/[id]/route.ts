import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GateResult =
  | { ok: true; backend: string }
  | { ok: false; backend: string; status: number; error: string };

async function requireAdmin(req: Request): Promise<GateResult> {
  const backend = process.env.BACKEND_URL || "";

  if (!backend) {
    return { ok: false, backend: "", status: 500, error: "Missing BACKEND_URL in .env.local" };
  }

  const meRes = await fetch(`${backend}/api/auth/profile`, {
    headers: {
      Cookie: req.headers.get("cookie") ?? "",
      Authorization: req.headers.get("authorization") ?? "",
    },
    cache: "no-store",
  });

  if (!meRes.ok) {
    return { ok: false, backend, status: 401, error: "Unauthorized" };
  }

  const me = await meRes.json();
  const roles: string[] = Array.isArray(me?.roles) ? me.roles : [];
  const isAdmin = roles.some((r) => String(r).toLowerCase() === "admin");

  if (!isAdmin) {
    return { ok: false, backend, status: 403, error: "Forbidden" };
  }

  return { ok: true, backend };
}

function candidatesForUser(base: string, id: string) {
  return [
    `${base}/api/admin/users/${id}`,
    `${base}/admin/users/${id}`,
    `${base}/api/users/${id}`,
    `${base}/users/${id}`,
  ];
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = ctx.params;
  const bodyText = await req.text();

  const candidates = candidatesForUser(gate.backend, id);
  const errors: any[] = [];

  for (const target of candidates) {
    try {
      const upstream = await fetch(target, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") ?? "",
          Authorization: req.headers.get("authorization") ?? "",
        },
        body: bodyText,
        cache: "no-store",
      });

      const text = await upstream.text();

      if (!upstream.ok) {
        errors.push({ target, status: upstream.status, body: text.slice(0, 250) });
        continue;
      }

      // return response (json if possible)
      try {
        return NextResponse.json(JSON.parse(text));
      } catch {
        return NextResponse.json({ ok: true, raw: text });
      }
    } catch (e: any) {
      errors.push({ target, error: e?.message ?? String(e) });
    }
  }

  return NextResponse.json(
    { error: "No matching backend PATCH endpoint found", tried: candidates, details: errors },
    { status: 502 }
  );
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = ctx.params;

  const candidates = candidatesForUser(gate.backend, id);
  const errors: any[] = [];

  for (const target of candidates) {
    try {
      const upstream = await fetch(target, {
        method: "DELETE",
        headers: {
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

      if (!text) return NextResponse.json({ ok: true });

      try {
        return NextResponse.json(JSON.parse(text));
      } catch {
        return NextResponse.json({ ok: true, raw: text });
      }
    } catch (e: any) {
      errors.push({ target, error: e?.message ?? String(e) });
    }
  }

  return NextResponse.json(
    { error: "No matching backend DELETE endpoint found", tried: candidates, details: errors },
    { status: 502 }
  );
}