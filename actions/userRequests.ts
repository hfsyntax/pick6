"use server"
import type { FormResult } from "../types"
import { getSession } from "../lib/session"
import { getConfigValue } from "../actions/serverRequests"
import { redirect } from "next/navigation"
import { hash, compare, genSalt } from "bcryptjs"
import { sql } from "@vercel/postgres"
import { revalidateTag } from "next/cache"

export async function handlePicks(formData: FormData): Promise<FormResult> {
  try {
    const session = await getSession()

    if (!session) {
      return { error: "Error: unauthorized to make picks" }
    }

    const currentSeason = Number(await getConfigValue("CURRENT_SEASON"))
    const currentWeek = Number(await getConfigValue("CURRENT_WEEK"))

    if (!currentSeason || !currentWeek) {
      return {
        error:
          "Error: the week/season needs to be set to a value greater than 0 before picks can be made",
      }
    }

    const timerPaused =
      (await getConfigValue("TIMER_PAUSED")) === "1" ? true : false
    const now = Date.now()
    const timerTime = Number(await getConfigValue("TARGET_RESET_TIME"))

    if (!timerTime || isNaN(timerTime) || now > timerTime || timerPaused) {
      return {
        error:
          "Error: the timer needs to be unpaused or non-negative before picks can be made.",
      }
    }

    const queryResult =
      await sql`SELECT season_number FROM weeks WHERE season_number = ${currentSeason} AND week_number = ${currentWeek}`

    if (queryResult.rowCount === 0) {
      return {
        error: `Error: the season/week need to be set to a value greater than 0 before picks can be made.`,
      }
    }

    const gameCount =
      await sql`SELECT COUNT(game_id) AS game_count FROM games WHERE season_number = ${currentSeason} AND week_number = ${currentWeek}`
    if (gameCount.rowCount === 0) {
      return {
        error: `Error: no games are available for week ${currentWeek} of season ${currentSeason}`,
      }
    }

    const username = session?.user?.username
    const authID = session?.user?.authID

    if (username === "root") {
      return { error: "Error: the root user cannot make picks" }
    }

    if (currentWeek === 1) {
      // ensure player has a stats entry for the season
      await sql`INSERT INTO playerseasonstats (player_id, season_number, group_number, gp)
            SELECT
                p.player_id,
                ${currentSeason},
                p.group_number,
                p.gp
            FROM
                players p
            WHERE p.player_id = ${authID}
            ON CONFLICT(player_id, season_number) DO NOTHING;
            `

      // ensure player has stats for the week
      await sql`INSERT INTO playerweekstats (player_id, season_number, week_number, group_number, gp)
            SELECT
                p.player_id,
                ${currentSeason},
                ${currentWeek},
                p.group_number,
                p.gp
            FROM
                players p
            WHERE p.player_id = ${authID}
            ON CONFLICT DO NOTHING;`
    } else {
      // check if stats entries exist
      const playerExists =
        await sql`SELECT player_id FROM playerseasonstats WHERE player_id = ${authID}`
      if (playerExists.rowCount === 0) {
        return { error: "Error: you are not a player in the current season" }
      }
    }

    const pickCount = Array.from(formData.keys()).length

    if (pickCount === 0) {
      return { error: `Error: no picks selected` }
    }

    const minPicks = Math.min(gameCount?.rows?.[0]?.game_count, 6)

    if (pickCount !== minPicks) {
      return {
        error: `"Error: the number of picks you selected is not ${minPicks} picks`,
      }
    }

    const maxGameIdQuery =
      await sql`SELECT MAX(game_id) AS max_game_id FROM games WHERE season_number = ${currentSeason} AND week_number = ${currentWeek}`
    const maxGameID = maxGameIdQuery?.rows?.[0]?.max_game_id

    const picks = {}

    for (const [teamID, gameID] of formData.entries()) {
      if (!picks[String(gameID)]) {
        picks[String(gameID)] = teamID
      } else {
        return {
          error:
            "Error: multiple teams were selected for one or more of your picks",
        }
      }
    }

    if (!picks[String(maxGameID)]) {
      return { error: "Error: no pick was made for the last game" }
    }

    // remove previous picks for week
    await sql`DELETE FROM playerselections ps
        USING games g 
        WHERE ps.game_id = g.game_id
        AND ps.player_id = ${authID}
        AND g.week_number = ${currentWeek}
        AND g.season_number = ${currentSeason}`

    for (let pick in picks) {
      const gameID = Number(pick)
      const teamID = picks[pick]
      await sql`INSERT INTO playerselections (player_id, game_id, selected_team_id)
            VALUES (${authID}, ${gameID}, ${teamID}) 
            ON CONFLICT(player_id, game_id) DO UPDATE SET selected_team_id = ${teamID};`
    }

    revalidateTag("weekPicks")

    await sql`
        INSERT INTO app_settings (key, value) 
        VALUES (weekStatsUpdated, ${Date.now().toString()}) 
        ON CONFLICT(key) 
        DO UPDATE SET value = ${Date.now().toString()}, updated_at = CURRENT_TIMESTAMP`
    return {
      message: `Sucessfully set picks for week ${currentWeek} of season ${currentSeason}`,
    }
  } catch (error) {
    if (error?.name === "AppConfigError") {
      return { error: "Error: failed to set/get app configuration variables" }
    } else {
      return { error: "Error: database connection/operation error" }
    }
  }
}

export async function changePassword(
  prevState: any,
  formData: FormData,
): Promise<FormResult> {
  try {
    const currentPassword = String(formData.get("currentPassword"))
    const newPassword = String(formData.get("newPassword"))
    const confirmNewPassword = String(formData.get("confirmNewPassword"))
    const session = await getSession()

    if (!session) {
      return redirect("/")
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return { error: "Error: form inputs cannot be empty" }
    }

    if (newPassword.length > 255) {
      return { error: "Error: password must be 255 characters or less" }
    }

    if (!newPassword.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/)) {
      return {
        error:
          "Error: new password must contain at least 6 characters, 1 uppercase letter and 1 number",
      }
    }

    if (newPassword !== confirmNewPassword) {
      return {
        error: "Error: new password does not match the confirmed new password",
      }
    }

    // compare current to db hash
    const username = String(session?.user?.username)
    const hashedPasswordQuery =
      await sql`SELECT password FROM playerauth WHERE username = ${username}`
    const hashedPassword = String(hashedPasswordQuery?.rows?.[0]?.password)
    const correctPassword = await compare(currentPassword, hashedPassword)
    if (correctPassword) {
      // set new password
      const salt = await genSalt()
      const newHashedPassword = await hash(newPassword, salt)
      const newPasswordQuery =
        await sql`UPDATE playerauth set password = ${newHashedPassword} WHERE username = ${username}`
      if (newPasswordQuery.rowCount > 0) {
        return { message: "Password change success" }
      } else {
        return { error: "Error: Failed to change password" }
      }
    } else {
      return { error: "Error: the current password you entered is incorrect" }
    }
  } catch (error) {
    return { error: "Error: database connection/operation error" }
  }
}

export async function updateProfilePictureURL(url: string) {
  try {
    const session = await getSession()
    if (!session) return redirect("/")
    const authID = session?.user?.authID
    await sql`UPDATE players SET picture_url = ${url} WHERE player_id = ${authID}`
    return { url: url }
  } catch (error) {
    throw error
  }
}
