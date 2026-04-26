import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = getDb()
    .prepare("SELECT id, name, api_key, created_at FROM projects WHERE owner_id = ? ORDER BY created_at ASC")
    .all(session.sub);

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required." }, { status: 400 });

  const id = uuid();
  const apiKey = `obs_${Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url")}`;
  getDb()
    .prepare("INSERT INTO projects (id, name, api_key, owner_id) VALUES (?, ?, ?, ?)")
    .run(id, name.trim(), apiKey, session.sub);

  return NextResponse.json({ id, name: name.trim(), api_key: apiKey }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  getDb()
    .prepare("DELETE FROM projects WHERE id = ? AND owner_id = ?")
    .run(id, session.sub);

  return NextResponse.json({ ok: true });
}
