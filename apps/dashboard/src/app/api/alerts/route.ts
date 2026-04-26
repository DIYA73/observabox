import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

function ownsProject(userId: string, projectId: string): boolean {
  const row = getDb()
    .prepare("SELECT id FROM projects WHERE id = ? AND owner_id = ?")
    .get(projectId, userId);
  return !!row;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId || !ownsProject(session.sub, projectId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rules = getDb()
    .prepare("SELECT * FROM alert_rules WHERE project_id = ? ORDER BY created_at ASC")
    .all(projectId);

  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, name, type, condition, webhookUrl } = body;

  if (!projectId || !name || !type || !condition || !webhookUrl)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  if (!ownsProject(session.sub, projectId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = uuid();
  getDb()
    .prepare("INSERT INTO alert_rules (id, project_id, name, type, condition_json, webhook_url) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, projectId, name, type, JSON.stringify(condition), webhookUrl);

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, projectId } = await req.json();
  if (!ownsProject(session.sub, projectId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  getDb().prepare("DELETE FROM alert_rules WHERE id = ? AND project_id = ?").run(id, projectId);
  return NextResponse.json({ ok: true });
}
