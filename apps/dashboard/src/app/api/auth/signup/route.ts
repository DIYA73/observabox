import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email and password (min 8 chars) required." }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

  const id = uuidv4();
  const hash = await bcrypt.hash(password, 12);
  db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, email, hash);

  // Create a default project for new users
  const projectId = uuid();
  const apiKey = `obs_${Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url")}`;
  db.prepare("INSERT INTO projects (id, name, api_key, owner_id) VALUES (?, ?, ?, ?)")
    .run(projectId, "My Project", apiKey, id);

  const token = await signToken({ sub: id, email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  res.cookies.set("ob_project", projectId, { sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
