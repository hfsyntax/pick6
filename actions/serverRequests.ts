"use server"
import type { SortFields, PickResult } from "../types"
import { cache } from "react"
import { getSession } from "../lib/session"
import type { QueryResultRow } from "@vercel/postgres"
import { sql } from "@vercel/postgres"
import { list, del } from "@vercel/blob"

export async function getConfigValue(
  key: string,
): Promise<QueryResultRow[string]> {
  try {
    const queryResult =
      await sql`SELECT value from app_settings WHERE key = ${key}`
    return queryResult?.rows?.[0]?.value
  } catch (error) {
    const newError = new Error(
      `Error: failed getting app configuration key: ${key}`,
    )
    newError.name = "AppConfigError"
    throw newError
  }
}

export const getSeasons = cache(async (): Promise<QueryResultRow[]> => {
  try {
    const queryResult =
      await sql`SELECT * FROM Seasons ORDER BY season_number ASC`
    return queryResult?.rows
  } catch (error) {
    return []
  }
})

export const getWeeks = cache(async (): Promise<QueryResultRow[]> => {
  try {
    const queryResult =
      await sql`SELECT * FROM weeks ORDER BY season_number, week_number ASC`
    return queryResult?.rows
  } catch (error) {
    return []
  }
})

export const getWeekGames = cache(
  async (season: string, week: string): Promise<QueryResultRow[]> => {
    try {
      const queryResult = await sql`SELECT 
        ROW_NUMBER() OVER (ORDER BY G.game_id) AS game_counter,
        T1.team_name AS favorite_team,
        T1.team_id AS favorite_id,
        G.game_id,
        G.spread,
        T2.team_name AS underdog_team,
        T2.team_id AS underdog_id
    FROM 
        Games G
        INNER JOIN Teams T1 ON G.favorite = T1.team_id
        INNER JOIN Teams T2 ON G.underdog = T2.team_id
        INNER JOIN Weeks W ON G.week_number = W.week_number AND G.season_number = W.season_number
    WHERE 
        W.week_number = ${week} 
        AND W.season_number = ${season}
    ORDER BY 
        G.game_id ASC;
        `
      return queryResult?.rows
    } catch (error) {
      return []
    }
  },
)

export const getWeekGameResults = cache(
  async (season: string, week: string): Promise<QueryResultRow[]> => {
    try {
      const queryResult = await sql`SELECT 
        ROW_NUMBER() OVER (ORDER BY G.game_id) AS game_counter,
        G.favorite_score,
        T1.team_name AS favorite,
        T1.team_id AS favorite_id,
        G.game_id,
        G.spread,
        T2.team_name AS underdog,
        G.underdog_score,
        T3.team_name as winner,
        T2.team_id AS underdog_id
    FROM 
        Games G
        INNER JOIN Teams T1 ON G.favorite = T1.team_id
        INNER JOIN Teams T2 ON G.underdog = T2.team_id
        LEFT JOIN Teams T3 on G.winner = T3.team_id
        INNER JOIN Weeks W ON G.week_number = W.week_number AND G.season_number = W.season_number
    WHERE 
        W.week_number = ${week} 
        AND W.season_number = ${season}
    ORDER BY 
        G.game_id ASC;
        `
      return queryResult?.rows
    } catch (error) {
      return []
    }
  },
)

export const getGameCountForWeek = cache(
  async (season: string, week: string): Promise<number> => {
    try {
      const queryResult =
        await sql`SELECT COUNT(game_id) AS game_count FROM Games WHERE season_number = ${season} AND week_number = ${week}`
      return queryResult?.rows?.[0]?.game_count
    } catch (error) {
      return 0
    }
  },
)

export const getWeekResults = cache(
  async (
    season: string,
    currentSeason: string,
    week: string,
  ): Promise<QueryResultRow[]> => {
    try {
      const queryResult = await sql`
        WITH players_info AS (
        SELECT
            w.week_number,
            COALESCE(pl.picture_url, '') || ' ' || pl.name || ' ' || pl.player_id AS loser_info,
            COALESCE(pw.picture_url, '') || ' ' || pw.name || ' ' || pw.player_id AS winner_info,
            ls.player_id AS loser_id,
            wn.player_id AS winner_id
        FROM
            Weeks w
        LEFT JOIN Winners wn ON w.season_number = wn.season_number AND w.week_number = wn.week_number
        LEFT JOIN Losers ls ON w.season_number = ls.season_number AND w.week_number = ls.week_number
        LEFT JOIN Players pw ON wn.player_id = pw.player_id
        LEFT JOIN Players pl ON ls.player_id = pl.player_id
        WHERE
            (w.season_number = ${season} AND w.week_number < ${week}) OR (w.season_number = ${season} AND w.season_number != ${currentSeason})
        )
        SELECT
            week_number,
            COALESCE(
                string_agg(DISTINCT loser_info, '<br>' ORDER BY loser_info), 'NONE!!!'
            ) AS loser_names,
            COALESCE(
                string_agg(DISTINCT winner_info, '<br>' ORDER BY winner_info), 'ROLL-OVER!!!'
            ) AS winner_names,
            COUNT(DISTINCT loser_id) AS losers_count,
            COUNT(DISTINCT winner_id) AS winners_count
        FROM
            players_info
        GROUP BY
            week_number
        ORDER BY
            week_number ASC;`
      return queryResult.rows
    } catch (error) {
      return []
    }
  },
)

export const getSeasonStats = cache(
  async (
    season: string,
    order: "asc" | "desc",
    fields: Array<SortFields>,
  ): Promise<QueryResultRow[]> => {
    try {
      const safeOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      const safeFields: Array<SortFields> = fields.filter(
        (field) =>
          field === "gp" || field === "group_number" || field === "rank",
      )
      const orderQuery =
        safeFields.length > 0
          ? `ORDER BY ${safeFields.map((f) => `ps.${f} ${safeOrder}`).join(", ")}`
          : ""

      const seasonNumber = isNaN(parseInt(season)) ? 0 : parseInt(season)

      const queryResult = await sql.query(
        `SELECT
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
        WHERE ps.season_number = $1
        GROUP BY ps.rank, ps.group_number, ps.gp, p.player_id, p.name, ps.won, ps.played, ps.win_percentage
        ${orderQuery}`,
        [seasonNumber],
      )
      return queryResult.rows
    } catch (error) {
      return []
    }
  },
)

export const getPicks = cache(
  async (
    season: string,
    week: string,
    order: string = "",
    fields: Array<SortFields>,
  ): Promise<PickResult> => {
    try {
      const safeOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      const safeFields: Array<SortFields> = fields.filter(
        (field) =>
          field === "gp" || field === "group_number" || field === "rank",
      )
      const orderQuery =
        safeFields.length > 0
          ? `ORDER BY ${safeFields.map((f) => `subquery.${f} ${safeOrder}`).join(", ")}`
          : ""
      const seasonNumber = isNaN(parseInt(season)) ? 0 : parseInt(season)
      const weekNumber = isNaN(parseInt(week)) ? 0 : parseInt(week)
      const queryResult = await sql.query(
        `SELECT DISTINCT
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
            WHEN array_length(selected_teams_arr, 1) >= 1 THEN selected_teams_arr[1]
            ELSE NULL
        END AS pick1,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 2 THEN selected_teams_arr[2]
            ELSE NULL
        END AS pick2,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 3 THEN selected_teams_arr[3]
            ELSE NULL
        END AS pick3,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 4 THEN selected_teams_arr[4]
            ELSE NULL
        END AS pick4,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 5 THEN selected_teams_arr[5]
            ELSE NULL
        END AS pick5,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 6 THEN selected_teams_arr[6]
            ELSE NULL
        END AS pick6
    FROM (
        SELECT
            pw.stat_id,
            p.name AS player_name,
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
            ARRAY(
                SELECT t.team_name
                FROM PlayerSelections AS ps
                INNER JOIN Games AS g ON ps.game_id = g.game_id
                INNER JOIN Teams AS t ON ps.selected_team_id = t.team_id
                WHERE ps.player_id = pw.player_id
                    AND g.season_number = pw.season_number
                    AND g.week_number = pw.week_number
                ORDER BY ps.selection_id
            ) AS selected_teams_arr
        FROM
            PlayerWeekStats pw
        INNER JOIN
            Players p ON pw.player_id = p.player_id
        WHERE
            pw.season_number = $1
            AND pw.week_number = $2
    ) AS subquery
    INNER JOIN PlayerSelections AS ps ON subquery.player_id = ps.player_id
    INNER JOIN Games AS g ON ps.game_id = g.game_id
    WHERE
    g.season_number = $1
    AND g.week_number = $2
    ${orderQuery}
    `,
        [seasonNumber, weekNumber],
      )

      const gameCount = await getGameCountForWeek(season, week)
      const picks = queryResult.rows.map((row: Object) => {
        let rowCopy = { ...row }
        for (let i = 6; i > gameCount; i--) {
          delete rowCopy[`pick${i}`]
        }
        return rowCopy
      })
      const headers = [
        "Rank",
        "#",
        "GP",
        "Player",
        "Won",
        "Played",
        "%",
      ].concat(
        Array.from(
          { length: Math.min(gameCount, 6) },
          (_, i) => "pick" + (i + 1),
        ),
      )
      return { picks: picks, headers: headers }
    } catch (error) {
      return { picks: [], headers: [] }
    }
  },
)

export async function getUser(id: string): Promise<QueryResultRow[]> {
  try {
    if (isNaN(Number(id))) return null
    const queryResult =
      await sql`SELECT auth_id, username from PlayerAuth where auth_id = ${id}`
    return queryResult.rows
  } catch (error) {
    return []
  }
}

export async function getUsersByName(
  users: string[],
): Promise<QueryResultRow[]> {
  try {
    if (users.length > 10) {
      throw new Error("too many users to parse")
    }

    const sanitizedUsers = users
      .map((username) =>
        String(username)
          .trim()
          .replace(/[^a-zA-Z0-9]/, "")
          .toLowerCase(),
      )
      .filter((username) => username.length > 0)

    if (sanitizedUsers.length === 0) return []

    const placeholders = sanitizedUsers.map((_, i) => `$${i + 1}`).join(", ")

    const queryResult = await sql.query(
      `SELECT username from playerauth where username IN (${placeholders})`,
      [sanitizedUsers],
    )
    return queryResult.rows
  } catch (error) {
    return []
  }
}

export async function getUserWeekPicks(id: string): Promise<PickResult> {
  try {
    const currentSeason = await getConfigValue("CURRENT_SEASON")
    const currentWeek = await getConfigValue("CURRENT_WEEK")
    const queryResult = await sql`SELECT DISTINCT
        subquery.name,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 1 THEN selected_teams_arr[1]
            ELSE NULL
        END AS pick1,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 2 THEN selected_teams_arr[2]
            ELSE NULL
        END AS pick2,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 3 THEN selected_teams_arr[3]
            ELSE NULL
        END AS pick3,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 4 THEN selected_teams_arr[4]
            ELSE NULL
        END AS pick4,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 5 THEN selected_teams_arr[5]
            ELSE NULL
        END AS pick5,
        CASE
            WHEN array_length(selected_teams_arr, 1) >= 6 THEN selected_teams_arr[6]
            ELSE NULL
        END AS pick6
    FROM (
        SELECT
            pw.stat_id,
            p.name,
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
            ARRAY(
                SELECT t.team_name
                FROM PlayerSelections AS ps
                INNER JOIN Games AS g ON ps.game_id = g.game_id
                INNER JOIN Teams AS t ON ps.selected_team_id = t.team_id
                WHERE ps.player_id = pw.player_id
                    AND g.season_number = pw.season_number
                    AND g.week_number = pw.week_number
                ORDER BY ps.selection_id
            ) AS selected_teams_arr
        FROM
            PlayerWeekStats pw
        INNER JOIN
            Players p ON pw.player_id = p.player_id
        WHERE
            pw.season_number = ${currentSeason}
            AND pw.week_number = ${currentWeek}
            AND pw.player_id = ${id}
    ) AS subquery
    INNER JOIN PlayerSelections AS ps ON subquery.player_id = ps.player_id
    INNER JOIN Games AS g ON ps.game_id = g.game_id
    WHERE
        g.season_number = ${currentSeason}
        AND g.week_number = ${currentWeek};
    `
    const gameCount = await getGameCountForWeek(currentSeason, currentWeek)
    const picks = queryResult.rows.map((row: {}) => {
      let rowCopy = { ...row }
      for (let i = 6; i > gameCount; i--) {
        delete rowCopy[`pick${i}`]
      }
      return rowCopy
    })
    const headers = ["Player"].concat(
      Array.from(
        { length: Math.min(gameCount, 6) },
        (_, i) => "pick" + (i + 1),
      ),
    )
    return { picks: picks, headers: headers }
  } catch (error) {
    return { picks: [], headers: [] }
  }
}

export async function getUserSeasonsData(
  id: string,
): Promise<QueryResultRow[]> {
  try {
    const queryResult = await sql`SELECT
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
        WHERE p.player_id = ${id}`
    return queryResult.rows
  } catch (error) {
    return []
  }
}

export async function isTimerPaused(): Promise<boolean> {
  try {
    return (await getConfigValue("TIMER_PAUSED")) === "1" ? true : false
  } catch (error) {
    return true
  }
}

export async function calculateTimeUntilReset(): Promise<number> {
  try {
    const timerEnds = Number(await getConfigValue("TARGET_RESET_TIME"))
    const now = Date.now()
    return timerEnds - now
  } catch (error) {
    return 0
  }
}

export async function clearUserCredentialsFile() {
  try {
    let cursor

    do {
      const listResult = await list({
        cursor,
        limit: 1000,
      })

      if (listResult.blobs.length > 0) {
        await del(listResult.blobs.map((blob) => blob.url))
      }

      cursor = listResult.cursor
    } while (cursor)

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export async function getProfilePictureURL(): Promise<
  QueryResultRow[string]
> | null {
  try {
    const session = await getSession()
    const authID = session?.user?.authID
    const profileURL =
      await sql`SELECT picture_url FROM Players WHERE player_id = ${authID}`
    return profileURL?.rows?.[0]?.picture_url
  } catch (error) {
    return null
  }
}
