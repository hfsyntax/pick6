import { NextRequest, NextResponse } from "next/server"
import { updateSession, getSession } from "./lib/session"

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|p6.png|default.png|static-assets).*)",
}

export async function middleware(request: NextRequest) {
  console.log(`path is ${request.nextUrl.pathname}`)
  const response = await updateSession(request)
  const session = await getSession()
  if (session && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/games", request.url))
  } else if (!session && request.nextUrl.pathname === "/profile") {
    return NextResponse.redirect(new URL("/games", request.url))
  } else if (
    session?.user?.type !== "admin" &&
    ["/admin_utility", "/admin_guide"].includes(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/games", request.url))
  } else {
    return response
  }
}
