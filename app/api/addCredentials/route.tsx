import { getSession } from "../../../lib/session"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  const session = await getSession()
  const formData = await request.formData()
  const token = formData.get("token")
  const credentialsFile = formData.get("file")
  if (!formData || !token || !credentialsFile) {
    return NextResponse.json({ error: "400 content missing" }, { status: 400 })
  }

  if (token !== process.env.USER_CREDENTIALS_TOKEN) {
    return NextResponse.json({ error: "401 Unauthorized" }, { status: 401 })
  }

  const blob = await put("user_crendentials.csv", credentialsFile, {
    access: "public",
  })

  return NextResponse.json(blob)
}
