import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC = ["/login", "/signup", "/api/auth/login", "/api/auth/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();

  const token = request.cookies.get("ob_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
