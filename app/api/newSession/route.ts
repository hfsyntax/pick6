import { NextRequest, NextResponse } from "next/server";
import { encrypt, decrypt } from "../../../lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const referer = new URL(headersList.get("referer")).pathname
    const session = request.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ error: "401 Unauthorized" }, { status: 401 })
    // Refresh the session so it doesn't expire
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 60 * 1000);
    const res = NextResponse.json({ success: true }, { status: 201 });
    res.cookies.set({
      name: "session",
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
    });
    revalidatePath(referer)
    return res
  } catch (error) {
    if (error.name === "JWTExpired") {
      revalidatePath("/")
      redirect("/")
    } else {
      throw error
    }
  }
}