import {readFileSync, writeFileSync} from "fs"
import {EOL} from "os"
import { dirname, resolve } from "path"
import { fileURLToPath } from 'url'
import { QueryResultRow, sql } from "@vercel/postgres"
import { getSession } from "./session"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFilePath = resolve(dirname(__dirname), ".env")
const readEnvVars = () => readFileSync(envFilePath, "utf-8").split(EOL)

export async function getConfigValue(key: string) : Promise<QueryResultRow[string]> {
    const queryResult = await sql`SELECT value from app_settings WHERE key = ${key}`
    return queryResult?.rows?.[0]?.value
}

export async function setConfigValue (key: string, value: string|number) : Promise<boolean> {
    const queryResult = await sql`
    INSERT INTO app_settings (key, value) 
    VALUES (${key}, ${value}) 
    ON CONFLICT(key) 
    DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP`
    return queryResult?.rowCount > 0
}