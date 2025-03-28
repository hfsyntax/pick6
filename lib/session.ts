"use server"
import { SignJWT, jwtVerify } from "jose"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { sql } from "@vercel/postgres"

const secretKey = process.env.SESSION_SECRET_KEY
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    throw error
  }
}

async function validateRecaptcha(token: string) {
  const recaptchaResponse = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  )
  const responseBody = await recaptchaResponse.json()
  return responseBody?.success && responseBody?.score >= 0.3
}

export async function login(prevState: any, formData: FormData) {
  // Verify credentials && get the user
  const username = String(formData.get("username"))
  const password = String(formData.get("password"))
  const recaptchaResponse = String(formData.get("g-recaptcha-response"))

  if (!username || !password) {
    revalidatePath("/")
    return { error: "incorrect username or password" }
  }

  if (username.length > 32 || password.length > 128) {
    revalidatePath("/")
    return { error: "incorrect username or password" }
  }

  if (!recaptchaResponse) {
    return { error: "no reCAPTCHA token set." }
  }

  const recaptchaValidated = await validateRecaptcha(recaptchaResponse)

  if (!recaptchaValidated) {
    return { error: "reCAPTCHA validation failed" }
  }

  const dbUser =
    await sql`SELECT auth_id, password, is_active, type FROM playerauth WHERE username = ${username}`

  if (dbUser.rowCount === 1) {
    const hashedPassword = String(dbUser?.rows?.[0]?.["password"])
    const correctPassword = await compare(password, hashedPassword)
    if (correctPassword) {
      if (dbUser?.rows?.[0]?.["is_active"]) {
        const userType = String(dbUser?.rows?.[0]?.["type"])
        const authID = Number(dbUser?.rows?.[0]?.["auth_id"])
        const user = {
          username: username,
          password: hashedPassword,
          type: userType,
          authID: authID,
        }
        const expires = new Date(Date.now() + 60 * 60 * 1000)
        const session = await encrypt({ user, expires })
        const cookieStore = await cookies()
        cookieStore.set("session", session, { expires, httpOnly: true })
        return redirect("/teams")
      } else {
        revalidatePath("/")
        return { error: "your account has been temporarily disabled" }
      }
    } else {
      revalidatePath("/")
      return { error: "incorrect username or password" }
    }
  } else {
    revalidatePath("/")
    return { error: "incorrect username or password" }
  }
}

export async function logout() {
  // Destroy the session
  const cookieStore = await cookies()
  cookieStore
    .delete("session")
    .delete("session")
    .delete("error")
    .delete("edgestore-ctx")
    .delete("edgestore-token")
  revalidatePath("/")
  return redirect("/")
}

// session timeout idle on page
export async function redirectToLogin() {
  const cookieStore = await cookies()
  if (!cookieStore.get("error")) {
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    cookieStore.set("error", "session timeout", { expires, httpOnly: true })
  }
  cookieStore.delete("session")
  revalidatePath("/")
  return redirect("/")
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value
  if (!session) return null
  return await decrypt(session)
}

export async function updateSession(request: NextRequest) {
  try {
    const session = request.cookies.get("session")?.value
    if (!session) {
      return
    }
    // Refresh the session so it doesn't expire
    const parsed = await decrypt(session)
    parsed.expires = new Date(Date.now() + 60 * 60 * 1000)
    const res = NextResponse.next()
    res.cookies.set({
      name: "session",
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
    })
    return res
  } catch (error) {
    if (error.name === "JWTExpired") {
      const cookieStore = await cookies()
      if (!cookieStore.get("error")) {
        const expires = new Date(Date.now() + 60 * 60 * 1000)
        cookieStore.set("error", "session timeout", { expires, httpOnly: true })
      }
      revalidatePath("/")
      return redirect("/")
    } else {
      throw error
    }
  }
}

export async function checkSessionTimeout() {
  const cookieStore = await cookies()
  const errorMessage = cookieStore.get("error")?.value
  if (errorMessage === "session timeout") {
    cookieStore.delete("error")
    return errorMessage
  }
  return null
}
