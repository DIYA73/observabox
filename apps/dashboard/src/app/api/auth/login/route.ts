import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const db = getDb();
  const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email) as
    | { id: string; email: string; password_hash: string }
    | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Set active project to first owned project
  const project = db.prepare("SELECT id FROM projects WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1").get(user.id) as
    | { id: string }
    | undefined;

  const token = await signToken({ sub: user.id, email: user.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  if (project) res.cookies.set("ob_project", project.id, { sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
