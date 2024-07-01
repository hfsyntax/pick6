import { NextRequest, NextResponse } from "next/server";
import { updateSession, getSession } from "./lib/session";

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|static-assets|img|profile_pictures|http|https).*)"
}

export async function middleware(request: NextRequest) {
  console.log(`path is ${request.nextUrl.pathname}`)
  const response = await updateSession(request)
  const session = await getSession()
  console.log(`session expiring at:`)
  console.log(new Date(session?.exp * 1000).toLocaleString())
  if (session && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/games", request.url))
  } else if (session && session?.user?.type !== "admin" && ["/admin_utility", "/admin_guide"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/games", request.url))
  }
  else if (!session && request.nextUrl.pathname !== "/") {
    console.log("path is not login redirecting...")
    return NextResponse.redirect(new URL("/", request.url))
  } else {
    return response
  }
}