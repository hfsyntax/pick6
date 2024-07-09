"use server"
import { getSession } from "../lib/session"
import { getConfigValue } from "../lib/configHandler"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hash, compare, genSalt } from "bcryptjs"
import { sql } from '@vercel/postgres';

export async function handlePicks(prevState: string, formData: FormData) {
    const session = await getSession()

    if (!session) {
        revalidatePath("/teams")
        return {error: "Error: unauthorized to make picks"}
    }
    
    const currentSeason = Number(await getConfigValue("CURRENT_SEASON"))
    const currentWeek = Number(await getConfigValue("CURRENT_WEEK"))

    if (!currentSeason || !currentWeek) {
        revalidatePath("/teams")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before picks can be made" }
    }

    const timerPaused = await getConfigValue("TIMER_PAUSED") === "1" ? true : false
    const now = Date.now()
    const timerTime = Number(await getConfigValue("TARGET_RESET_TIME"))

    if (!timerTime || isNaN(timerTime) || now > timerTime  || timerPaused) {
        revalidatePath("/teams")
        return { error: "Error: the timer needs to be unpaused or non-negative before picks can be made." }
    }

    const queryResult = await sql`SELECT season_number FROM weeks WHERE season_number = ${currentSeason} AND week_number = ${currentWeek}`

    if (queryResult.rowCount === 0) {
        revalidatePath("/teams")
        return { error: `Error: the season/week need to be set to a value greater than 0 before picks can be made.` }
    }

    const gameCount = await sql`SELECT COUNT(game_id) AS game_count FROM games WHERE season_number = ${currentSeason} AND week_number = ${currentWeek}`
    if (gameCount.rowCount === 0) {
        revalidatePath("/teams")
        return { error: `Error: no games are available for week ${currentWeek} of season ${currentSeason}` }
    }

    const username = session?.user?.username
    const authID = session?.user?.authID

    if (username === "root") {
        revalidatePath("/teams")
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
        const playerExists = await sql`SELECT player_id FROM playerseasonstats WHERE player_id = ${authID}`
        if (playerExists.rowCount === 0) {
            revalidatePath("/teams")
            return { error: "Error: you are not a player in the current season" }
        }
    }

    const pickCount = Array.from(formData.keys()).length

    if (pickCount === 0) {
        revalidatePath("/teams")
        return { error: `Error: no picks selected` }
    }

    const minPicks = Math.min(gameCount?.rows?.[0]?.game_count, 6)

    if (pickCount !== minPicks) {
        revalidatePath("/teams")
        return { error: `"Error: the number of picks you selected is not ${minPicks} picks` }
    }

    const maxGameIdQuery = await sql`SELECT MAX(game_id) AS max_game_id FROM games WHERE season_number = ${currentSeason} AND week_number = ${currentWeek}`
    const maxGameID = maxGameIdQuery?.rows?.[0]?.max_game_id

    const picks = {}

    for (const [teamID, gameID] of formData.entries()) {
        if (!picks[String(gameID)]) {
            picks[String(gameID)] = teamID
        } else {
            revalidatePath("/teams")
            return { error: "Error: multiple teams were selected for one or more of your picks" }
        }
    }

    if (!picks[String(maxGameID)]) {
        revalidatePath("/teams")
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

    revalidatePath("/teams")
    revalidatePath("/weekly")
    return { message: `Sucessfully set picks for week ${currentWeek} of season ${currentSeason}` }
}

export async function changePassword(prevState: string, formData: FormData) {
    const currentPassword = String(formData.get("currentPassword"))
    const newPassword = String(formData.get("newPassword"))
    const confirmNewPassword = String(formData.get("confirmNewPassword"))
    const session = await getSession()

    if (!session) {
        return redirect("/")
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        revalidatePath("/profile")
        return { error: "Error: form inputs cannot be empty" }
    }

    if (newPassword.length > 255) {
        revalidatePath("/profile")
        return { error: "Error: password must be 255 characters or less" }
    }

    if (!newPassword.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/)) {
        revalidatePath("/profile")
        return { error: "Error: new password must contain at least 6 characters, 1 uppercase letter and 1 number" }
    }

    if (newPassword !== confirmNewPassword) {
        revalidatePath("/profile")
        return { error: "Error: new password does not match the confirmed new password" }
    }

    // compare current to db hash
    const username = String(session?.user?.username)
    const hashedPasswordQuery = await sql`SELECT password FROM playerauth WHERE username = ${username}`
    const hashedPassword = String(hashedPasswordQuery?.rows?.[0]?.password)
    const correctPassword = await compare(currentPassword, hashedPassword)
    if (correctPassword) {
        // set new password
        const salt = await genSalt()
        const newHashedPassword = await hash(newPassword, salt)
        const newPasswordQuery = await sql`UPDATE playerauth set password = ${newHashedPassword} WHERE username = ${username}`
        if (newPasswordQuery.rowCount > 0) {
            revalidatePath("/profile")
            return { message: "Password change success" }
        } else {
            revalidatePath("/profile")
            return { error: "Error: Failed to change password" }
        }
    } else {
        revalidatePath("/profile")
        return { error: "Error: the current password you entered is incorrect" }
    }
}

export async function updateProfilePictureURL(url: string) {
    const session = await getSession()
    if (!session) return redirect("/")
    const authID = session?.user?.authID
    await sql`UPDATE players SET picture_url = ${url} WHERE player_id = ${authID}`
    revalidatePath("/profile")
    return { url: url }
}   