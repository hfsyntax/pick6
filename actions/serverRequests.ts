"use server"
import { cache } from "react"
import { handleDatabaseConnection } from "../lib/db"
import { join } from "path"
import { truncate as truncateFn } from "fs"
import { promisify } from "util"
import { revalidatePath } from "next/cache"
import { getSession } from "../lib/session"

const truncate = promisify(truncateFn)

export const getSeasons = cache(async () => {
    return []
    /*await handleDatabaseConnection()
    const sql = `SELECT * FROM Seasons`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql)
    dbConnection.release()
    return queryResult*/
})

export const getWeeks = cache(async () => {
    await handleDatabaseConnection()
    const sql = `SELECT * FROM Weeks`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql)
    dbConnection.release()
    return queryResult
})

export const getWeekGames = cache(async (season: string, week: string) => {
    await handleDatabaseConnection()
    const sql = `SELECT 
    @counter := @counter + 1 AS game_counter,
    T1.team_name AS favorite_team,
    T1.team_id AS favorite_id,
    G.game_id,
    G.spread,
    T2.team_name AS underdog_team,
    T2.team_id AS underdog_id
FROM 
    (SELECT @counter := 0) AS init,
    Games G
    INNER JOIN Teams T1 ON G.favorite = T1.team_id
    INNER JOIN Teams T2 ON G.underdog = T2.team_id
    INNER JOIN Weeks W ON G.week_number = W.week_number AND G.season_number = W.season_number
WHERE 
    W.week_number = ? 
    AND W.season_number = ?
ORDER BY 
    G.game_id ASC`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [week, season])
    dbConnection.release()
    return queryResult
})

export const getWeekGameResults = cache(async (season: string, week: string) => {
    await handleDatabaseConnection()
    const sql = `SELECT
    (@counter := @counter + 1) AS game_number,
    g.favorite_score,
    t1.team_name AS favorite,
    g.spread,
    t2.team_name AS underdog,
    g.underdog_score,
    t3.team_name AS winner
    FROM
    (SELECT * FROM Games WHERE week_number = ? AND season_number = ? ORDER BY game_id) AS g
    JOIN
    Teams t1 ON g.favorite = t1.team_id
    JOIN
    Teams t2 ON g.underdog = t2.team_id
    LEFT JOIN
    Teams t3 ON g.winner = t3.team_id,
    (SELECT @counter := 0) AS c`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [week, season])
    dbConnection.release()
    return queryResult
})

export const getGameCountForWeek = cache(async (season: string, week: string) => {
    await handleDatabaseConnection()
    const sql = "SELECT COUNT(game_id) FROM Games AS game_count WHERE season_number = ? AND week_number = ?"
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [season, week])
    dbConnection.release()
    return queryResult
})

export const getWeekResults = cache(async (currentSeason: string, season: string, week: string) => {
    await handleDatabaseConnection()
    const sql = `SELECT
    w.week_number,
    COALESCE(GROUP_CONCAT(DISTINCT CONCAT(COALESCE(pl.picture_url, ''), ' ', pl.name, ' ', pl.player_id) ORDER BY w.week_number ASC SEPARATOR '<br>'), 'NONE!!!') AS loser_names,
    COALESCE(GROUP_CONCAT(DISTINCT CONCAT(COALESCE(pw.picture_url, ''), ' ', pw.name, ' ', pw.player_id) ORDER BY w.week_number ASC SEPARATOR '<br>'), 'ROLL-OVER!!!') AS winner_names
FROM
    Weeks w
    LEFT JOIN
    Winners wn ON w.season_number = wn.season_number AND w.week_number = wn.week_number
    LEFT JOIN
    Losers ls ON w.season_number = ls.season_number AND w.week_number = ls.week_number
    LEFT JOIN
    Players pw ON wn.player_id = pw.player_id
    LEFT JOIN
    Players pl ON ls.player_id = pl.player_id
WHERE
    (w.season_number = ? AND w.week_number != ?) OR (w.season_number = ? AND w.season_number != ?)
GROUP BY
    w.week_number
ORDER BY
    w.week_number ASC`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [season, week, season, currentSeason])
    dbConnection.release()
    return queryResult
})

export const getSeasonStats = cache(async (season: string, order: string = "", sort: string = "", sort2: string = "") => {
    await handleDatabaseConnection()
    const sql = `SELECT
    ps.rank,
    ps.group_number,
    ps.gp,
    p.player_id,
    p.picture_url,
    p.name AS player_name,
    ps.won,
    ps.played,
    ps.win_percentage
    FROM PlayerSeasonStats ps
    JOIN Players p ON ps.player_id = p.player_id
    WHERE ps.season_number = ?
    GROUP BY ps.rank, ps.group_number, ps.gp, p.name, ps.won, ps.played, ps.win_percentage
    ORDER BY
        CASE
            WHEN ? = 'asc' THEN ps.rank
        END ASC,
        CASE
            WHEN ? = 'desc' THEN ps.rank
        END DESC,
        CASE
            WHEN ? = 'gp' THEN ps.gp
        END ASC,
        CASE
            WHEN ? = 'desc' AND ? = 'gp' THEN ps.gp
        END DESC,
        CASE
            WHEN ? = 'group_number' THEN ps.group_number
        END ASC,
        CASE
            WHEN ? = 'desc' AND ? = 'group_number' THEN ps.group_number
        END DESC,
        CASE
            WHEN ? = 'gp' THEN ps.gp
        END ASC,
        CASE
            WHEN ? = 'desc' AND ? = 'gp' THEN ps.gp
        END DESC,
        CASE
            WHEN ? = 'group_number' THEN ps.group_number
        END ASC,
        CASE
            WHEN ? = 'desc' AND ? = 'group_number' THEN ps.group_number
        END DESC`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [season, order, order, sort, order, sort, sort, order, sort, sort2, order, sort2, sort2, order, sort2])
    dbConnection.release()
    return queryResult
})

export const getPicks = cache(async (season: string, week: string, order: string = "", sort: string = "", sort2: string = "") => {
    await handleDatabaseConnection()
    const sql = `SELECT DISTINCT
subquery.player_id,
subquery.rank,
subquery.group_number,
subquery.gp,
subquery.picture_url,
subquery.player_name,
subquery.won,
subquery.played,
subquery.win_percentage,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 1 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 1), ', ', -1)
    ELSE NULL
END AS pick1,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 2 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 2), ', ', -1)
    ELSE NULL
END AS pick2,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 3 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 3), ', ', -1)
    ELSE NULL
END AS pick3,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 4 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 4), ', ', -1)
    ELSE NULL
END AS pick4,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 5 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 5), ', ', -1)
    ELSE NULL
END AS pick5,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 = 6 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 6), ', ', -1)
    ELSE NULL
END AS pick6
FROM (
SELECT
    pw.stat_id,
    p.name as player_name,
    p.picture_url,
    pw.gp,
    pw.group_number,
    pw.player_id,
    pw.season_number,
    pw.week_number,
    pw.rank,
    pw.won,
    pw.lost,
    pw.played,
    pw.win_percentage,
    (
        SELECT GROUP_CONCAT(t.team_name ORDER BY ps.selection_id SEPARATOR ', ')
        FROM PlayerSelections AS ps
        INNER JOIN Games AS g ON ps.game_id = g.game_id
        INNER JOIN Teams AS t ON ps.selected_team_id = t.team_id
        WHERE ps.player_id = pw.player_id
            AND g.season_number = pw.season_number
            AND g.week_number = pw.week_number
    ) AS selected_teams
FROM
    PlayerWeekStats pw
INNER JOIN
    Players p ON pw.player_id = p.player_id
WHERE
    pw.season_number = ? 
    AND pw.week_number = ? 
) AS subquery
INNER JOIN PlayerSelections AS ps ON subquery.player_id = ps.player_id
INNER JOIN Games AS g ON ps.game_id = g.game_id
WHERE g.season_number = ? 
AND g.week_number = ?
ORDER BY
    CASE
        WHEN ? = 'asc' THEN subquery.rank
    END ASC,
    CASE
        WHEN ? = 'desc' THEN subquery.rank
    END DESC,
    CASE
        WHEN ? = 'gp' THEN subquery.gp
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'gp' THEN subquery.gp
    END DESC,
    CASE
        WHEN ? = 'group_number' THEN subquery.group_number
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'group_number' THEN subquery.group_number
    END DESC,
    CASE
        WHEN ? = 'gp' THEN subquery.gp
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'gp' THEN subquery.gp
    END DESC,
    CASE
        WHEN ? = 'group_number' THEN subquery.group_number
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'group_number' THEN subquery.group_number
    END DESC;`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [season, week, season, week, order, order, sort, order, sort, sort, order, sort, sort2, order, sort2, sort2, order, sort2])
    const [{ 'COUNT(game_id)': gameCount }] = await getGameCountForWeek(season, week)
    dbConnection.release()
    const picks = queryResult.map((row: Object) => {
        let rowCopy = { ...row }
        for (let i = 6; i > gameCount; i--) {
            delete rowCopy[`pick${i}`]
        }
        return rowCopy;
    })
    const headers = ["Rank", "#", "GP", "Player", "Won", "Played", "%"]
        .concat(Array.from({ length: Math.min(gameCount, 6) }, (_, i) => "pick" + (i + 1)))
    return { picks: picks, headers: headers }
})

export async function getUser(id: string) {
    return null
    /*if (isNaN(Number(id))) return null
    await handleDatabaseConnection()
    const sql = `SELECT auth_id, username from PlayerAuth where auth_id = ?`
    const dbConnection = await global["dbConnection"].getConnection()
    const [[queryResult]] = await dbConnection.execute(sql, [id])
    dbConnection.release()
    return queryResult*/
}

export async function getUsersByName(users: string[]) {
    return []
    /*if (users.length > 10) {
        throw new Error("too many users to parse")
    }
    await handleDatabaseConnection()
    const sql = `SELECT username from PlayerAuth where username IN (${users.map(user => `'${user}'`).join()})`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql)
    dbConnection.release()
    return queryResult*/
}

export async function getUserWeekPicks(id: string) {
    return []
    /*await handleDatabaseConnection()
    const currentSeason = process.env.CURRENT_SEASON
    const currentWeek = process.env.CURRENT_WEEK
    const sql = `SELECT DISTINCT
    subquery.name,
    CASE
        WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 1 THEN 
            SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 1), ', ', -1)
        ELSE NULL
    END AS pick1,
    CASE
        WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 2 THEN 
            SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 2), ', ', -1)
        ELSE NULL
    END AS pick2,
    CASE
        WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 3 THEN 
            SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 3), ', ', -1)
        ELSE NULL
    END AS pick3,
    CASE
        WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 4 THEN 
            SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 4), ', ', -1)
        ELSE NULL
    END AS pick4,
    CASE
        WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 5 THEN 
            SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 5), ', ', -1)
        ELSE NULL
    END AS pick5,
    CASE
        WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 = 6 THEN 
            SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 6), ', ', -1)
        ELSE NULL
    END AS pick6
    FROM (
        SELECT
            pw.stat_id,
            p.name,
            pw.gp,
            pw.group_number,
            pw.player_id,
            pw.season_number,
            pw.week_number,
            pw.rank,
            pw.won,
            pw.lost,
            pw.played,
            pw.win_percentage,
            (
                SELECT GROUP_CONCAT(t.team_name ORDER BY ps.selection_id SEPARATOR ', ')
                FROM PlayerSelections AS ps
                INNER JOIN Games AS g ON ps.game_id = g.game_id
                INNER JOIN Teams AS t ON ps.selected_team_id = t.team_id
                WHERE ps.player_id = pw.player_id
                    AND g.season_number = pw.season_number
                    AND g.week_number = pw.week_number
            ) AS selected_teams
        FROM
            PlayerWeekStats pw
        INNER JOIN
            Players p ON pw.player_id = p.player_id
        WHERE
            pw.season_number = ? 
            AND pw.week_number = ? 
    ) AS subquery
    INNER JOIN PlayerSelections AS ps ON subquery.player_id = ps.player_id
    INNER JOIN Games AS g ON ps.game_id = g.game_id
    WHERE g.season_number = ? 
    AND g.week_number = ?
    AND subquery.player_id = ?`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [currentSeason, currentWeek, currentSeason, currentWeek, id])
    dbConnection.release()
    const [{ 'COUNT(game_id)': gameCount }] = await getGameCountForWeek(currentSeason, currentWeek)
    const picks = queryResult.map((row: Object) => {
        let rowCopy = { ...row }
        for (let i = 6; i > gameCount; i--) {
            delete rowCopy[`pick${i}`]
        }
        return rowCopy;
    })
    if (queryResult.length === 0) return null
    const headers = ["Player"]
        .concat(Array.from({ length: Math.min(gameCount, 6) }, (_, i) => "pick" + (i + 1)))
    return { picks: picks, headers: headers }
    */
}

export async function getUserSeasonsData(id: string) {
    return []
    /*await handleDatabaseConnection()
    const sql = `SELECT
    ps.season_number,
    ps.group_number,
    ps.gp,
    p.name,
    ps.rank,
    ps.won,
    ps.played,
    ps.win_percentage
    FROM PlayerSeasonStats ps
    JOIN Players p ON ps.player_id = p.player_id
    WHERE p.player_id = ?`
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [id])
    dbConnection.release()
    return queryResult
    */
}

export async function isTimerPaused() {
    return process.env.TIMER_PAUSED === "1" ? true : false
}

export async function calculateTimeUntilReset() {
    const timerEnds = Number(process.env.TARGET_RESET_TIME)
    const now = Date.now()
    return timerEnds - now
}

export async function clearUserCredentialsFile() {
    const filePath = join(process.cwd(), "user_credentials.csv");
    try {
        await truncate(filePath)
        revalidatePath("/admin_utility")
        return true
    } catch (error) {
        console.error(error)
        revalidatePath("/admin_utility")
        return { error: "Error: failed to clear contents of user_credentials.csv" }
    }
}

export async function getProfilePictureURL() {
    return null
    /*
    const session = await getSession()
    await handleDatabaseConnection()
    const dbConnection = await global["dbConnection"].getConnection()
    const authID = session?.user?.authID
    const sql = `SELECT picture_url FROM Players WHERE player_id = ?`
    const [profileURL] = await dbConnection.execute(sql, [authID])
    dbConnection.release()
    return profileURL?.[0]?.picture_url
    */
}