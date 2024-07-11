import { sql } from "@vercel/postgres"
import { getSession } from "./session"

export async function setConfigValue (key: string, value: string|number) : Promise<boolean> {
    const queryResult = await sql`
    INSERT INTO app_settings (key, value) 
    VALUES (${key}, ${value}) 
    ON CONFLICT(key) 
    DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP`
    return queryResult?.rowCount > 0
}