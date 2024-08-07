import { getSession } from "../../../lib/session"
import { NextResponse } from "next/server"
import { promises } from "fs"
import { join } from "path"

export async function GET() {
  const session = await getSession();
  if (!session || (session && session?.user?.type !== "admin")) {
    return NextResponse.json({ error: "401 Unauthorized" }, { status: 401 });
  }

  try {
    const filePath = process.env.DEVELOPMENT ? 
    join(process.cwd(), "/tmp", "/user_credentials.csv") :
    join("/tmp", "user_credentials.csv")
    console.log(filePath)
    const buffer = await promises.readFile(filePath);
    if (buffer.length === 0) {
      return new Response(null, { status: 204 });
    }

    const headers = new Headers();
    headers.append("Content-Disposition", "attachment; filename=user_credentials.csv");
    headers.append("Content-Type", "text/csv");
    return new Response(buffer, { headers });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error: failed to download user credentials" }, { status: 500 });
  }
}