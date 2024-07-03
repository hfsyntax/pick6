"use server"
import { getSession } from "../lib/session"
import { handleDatabaseConnection } from "../lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hash, compare, genSalt } from "bcryptjs"

export async function handlePicks(prevState: string, formData: FormData) {
    return null
    /*await handleDatabaseConnection()
    const currentSeason = Number(process.env.CURRENT_SEASON)
    const currentWeek = Number(process.env.CURRENT_WEEK)

    if (currentSeason === 0 || currentWeek === 0) {
        revalidatePath("/teams")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before picks can be made" }
    }

    const timerPaused = process.env.TIMER_PAUSED === "1" ? true : false
    const now = Date.now()
    const timerTime = Number(process.env.TARGET_RESET_TIME)

    if (now > timerTime || timerPaused) {
        revalidatePath("/teams")
        return { error: "Error: the timer needs to be unpaused or non-negative before picks can be made." }
    }

    let sql = "SELECT season_number FROM Weeks WHERE season_number = ? AND week_number = ?";
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [currentSeason, currentWeek])

    if (queryResult.length === 0) {
        dbConnection.release()
        revalidatePath("/teams")
        return { error: `Error: the season/week need to be set to a value greater than 0 before picks can be made.` }
    }

    sql = "SELECT COUNT(game_id) AS game_count FROM Games WHERE season_number = ? AND week_number = ?"
    const [gameCount] = await dbConnection.execute(sql, [currentSeason, currentWeek])
    if (gameCount.length === 0) {
        dbConnection.release()
        revalidatePath("/teams")
        return { error: `Error: no games are available for week ${currentWeek} of season ${currentSeason}` }
    }

    const session = await getSession()
    const username = session?.user?.username
    const authID = session?.user?.authID

    if (username === "root") {
        dbConnection.release()
        revalidatePath("/teams")
        return { error: "Error: the root user cannot make picks" }
    }

    if (currentWeek === 1) {
        // ensure player has a stats entry for the season
        sql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number) VALUES (?, ?)"
        await dbConnection.execute(sql, [authID, currentSeason])

        // ensure player has stats for the week
        sql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number) VALUES (?, ?, ?)"
        await dbConnection.execute(sql, [authID, currentSeason, currentWeek])
    } else {
        // check if stats entries exist
        sql = "SELECT player_id FROM PlayerSeasonStats WHERE player_id = ?"
        const [playerExists] = await dbConnection.execute(sql, [authID])
        if (playerExists.length === 0) {
            dbConnection.release()
            revalidatePath("/teams")
            return { error: "Error: you are not a player in the current season" }
        }
    }

    const pickCount = Array.from(formData.keys()).length

    if (pickCount === 0) {
        dbConnection.release()
        revalidatePath("/teams")
        return { error: `Error: no picks selected` }
    }

    const minPicks = Math.min(gameCount[0].game_count, 6)

    if (pickCount !== minPicks) {
        dbConnection.release()
        revalidatePath("/teams")
        return { error: `"Error: the number of picks you selected is not ${minPicks} picks` }
    }

    sql = "SELECT MAX(game_id) AS max_game_id FROM Games WHERE season_number = ? AND week_number = ?"
    const [[{ "max_game_id": maxGameID }]] = await dbConnection.execute(sql, [currentSeason, currentWeek])

    const picks = {}

    for (const [teamID, gameID] of formData.entries()) {
        if (!picks[String(gameID)]) {
            picks[String(gameID)] = teamID
        } else {
            dbConnection.release()
            revalidatePath("/teams")
            return { error: "Error: multiple teams were selected for one or more of your picks" }
        }
    }

    if (!picks[String(maxGameID)]) {
        dbConnection.release()
        revalidatePath("/teams")
        return { error: "Error: no pick was made for the last game" }
    }

    // remove previous picks for week
    sql = `DELETE ps
    FROM PlayerSelections ps
    JOIN Games g ON ps.game_id = g.game_id
    WHERE ps.player_id = ?
      AND g.week_number = ?
      AND g.season_number = ?`
    await dbConnection.execute(sql, [authID, currentWeek, currentSeason])

    for (let pick in picks) {
        const gameID = Number(pick)
        const teamID = picks[pick]
        sql = "INSERT INTO PlayerSelections (player_id, game_id, selected_team_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE selected_team_id = ?"
        await dbConnection.execute(sql, [authID, gameID, teamID, teamID])
    }

    revalidatePath("/teams")
    dbConnection.release()
    return { message: `Sucessfully set picks for week ${currentWeek} of season ${currentSeason}` }
    */
}

export async function changePassword(prevState: string, formData: FormData) {
    return null
    /*const currentPassword = String(formData.get("currentPassword"))
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
        revalidatePath("/admin_utility")
        return { error: "Error: password must be 255 characters or less" }
    }

    if (!newPassword.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/)) {
        revalidatePath("/admin_utility")
        return { error: "Error: password must contain at least 6 characters, 1 uppercase letter and 1 number" }
    }

    if (newPassword !== confirmNewPassword) {
        revalidatePath("/profile")
        return { error: "Error: new password does not match current password" }
    }

    // compare current to db hash
    await handleDatabaseConnection()
    const dbConnection = await global["dbConnection"].getConnection()
    let sql = `SELECT password FROM PlayerAuth WHERE username = ?`
    const username = String(session?.user?.username)
    const [[{ "password": hashedPassword }]] = await dbConnection.execute(sql, [username])
    const correctPassword = await compare(currentPassword, String(hashedPassword))
    if (correctPassword) {
        // set new password
        const salt = await genSalt()
        const newHashedPassword = await hash(newPassword, salt)
        sql = "UPDATE PlayerAuth set password = ? WHERE username = ?"
        const [newPasswordQuery] = await dbConnection.execute(sql, [newHashedPassword, username])
        if (newPasswordQuery.affectedRows > 0) {
            dbConnection.release()
            revalidatePath("/profile")
            return { message: "Password change success" }
        } else {
            dbConnection.release()
            revalidatePath("/profile")
            return { error: "Error: Failed to change password" }
        }
    } else {
        dbConnection.release()
        revalidatePath("/profile")
        return { error: "Error: the current password you entered is incorrect" }
    }
    */
}

export async function updateProfilePictureURL(url: string) {
    return null
    /*const session = await getSession()
    if (!session) return redirect("/")
    const authID = session?.user?.authID
    await handleDatabaseConnection()
    const dbConnection = await global["dbConnection"].getConnection()
    const sql = `UPDATE Players SET picture_url = ? WHERE player_id = ?`
    await dbConnection.execute(sql, [url, authID])
    dbConnection.release()
    revalidatePath("/profile")
    return { url: url }*/
}   