"use server"
import { getSession } from "../lib/session"
import { handleDatabaseConnection } from "../lib/db"
import { getEnvValue, setEnvValue } from "../lib/configHandler"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {createWriteStream} from "fs"
import ms from "ms"
import {genSalt, hash} from "bcryptjs"

function randomPassword() {
    let str = ""
    const passwordLength = 12
    const keyspace = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for (let i = 0; i < passwordLength; ++i) {
        str += keyspace[Math.floor(Math.random() * (keyspace.length - 1))]
    }
    return str
}

async function toggleTimer() {
    setEnvValue("TIMER_PAUSED", process.env.TIMER_PAUSED === "1" ? 0 : 1)
    const timerStatus = getEnvValue("TIMER_PAUSED") === "1" ? "Paused" : "Unpaused"
    revalidatePath("/admin_utility")
    return { message: `Successfully ${timerStatus} the timer.` }
}

async function setTimer(time: FormDataEntryValue = "") {
    const addedTime = time ? ms(time.toString()) : ms("7d")
    const newTime = new Date(Date.now() + addedTime)
    setEnvValue("TARGET_RESET_TIME", newTime.getTime())
    revalidatePath("/admin_utility")
    return { message: `Successfully set the timer to ${newTime.toString()}.` }
}

async function setSeasonAndWeek(season: FormDataEntryValue = "", week: FormDataEntryValue = "") {
    await handleDatabaseConnection()
    const targetSeason = isNaN(Number(season)) ? 0 : Number(season)
    const targetWeek = isNaN(Number(week)) ? 0 : Number(week)
    let currentSeason = Number(process.env.CURRENT_SEASON)
    let currentWeek = Number(process.env.CURRENT_WEEK)
    let message = ""

    // set current season if left empty
    if (!season) {
        if (currentSeason <= 0) {
            revalidatePath("/admin_utility")
            return { error: "Error: the season is currently 0 and needs to be set" }
        } else {
            const sql = "INSERT IGNORE INTO Seasons (season_number) VALUES (?)";
            const dbConnection = await global["dbConnection"].getConnection()
            const [queryResult] = await dbConnection.execute(sql, [currentSeason])
            if (queryResult.affectedRows > 0) {
                message += `Inserted Season Entry ${currentSeason}<br/>`;
            }
            dbConnection.release()
        }
        // update current season
    } else {
        if (targetSeason <= 0) {
            revalidatePath("/admin_utility")
            return { error: "Error: the specified season must be greater than 0" }
        }
        const sql = "INSERT IGNORE INTO Seasons (season_number) VALUES (?)";
        const dbConnection = await global["dbConnection"].getConnection()
        const [queryResult] = await dbConnection.execute(sql, [targetSeason])
        if (queryResult.affectedRows > 0) {
            message += `Inserted Season Entry ${targetSeason}<br/>`;
        }
        dbConnection.release()
        setEnvValue("CURRENT_SEASON", targetSeason)
        message += `Set Season to ${targetSeason}<br/>`;
    }

    currentSeason = Number(getEnvValue("CURRENT_SEASON"))

    // set current week if left empty
    if (!week) {
        if (currentWeek <= 0) {
            revalidatePath("/admin_utility")
            return { error: "Error: the week is currently 0 and needs to be set." }
        }

        const sql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES (?, ?)";
        const dbConnection = await global["dbConnection"].getConnection()
        const [queryResult] = await dbConnection.execute(sql, [currentWeek, currentSeason])
        if (queryResult.affectedRows > 0) {
            message += `Inserted Week Entry ${currentWeek} for Season ${currentSeason}<br/>`;
        }
        dbConnection.release()
        // update week
    } else {
        if (targetWeek <= 0) {
            revalidatePath("/admin_utility")
            return { error: "Error: the specified week must be greater than 0" }
        }
        const sql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES (?, ?)";
        const dbConnection = await global["dbConnection"].getConnection()
        const [queryResult] = await dbConnection.execute(sql, [targetWeek, currentSeason])
        if (queryResult.affectedRows > 0) {
            message += `Inserted Week Entry ${targetWeek} for Season ${currentSeason}<br/>`;
        }
        dbConnection.release()
        setEnvValue("CURRENT_WEEK", targetWeek)
        message += `Set Week to ${targetWeek} for Season ${currentSeason}<br/>`;
    }
    revalidatePath("/admin_utility")
    return { message: message ? message : "No updates needed." }
}

async function insertUser(formData: FormData) {
    await handleDatabaseConnection()
    const currentSeason = Number(process.env.CURRENT_SEASON)
    const currentWeek = Number(process.env.CURRENT_WEEK)

    if (currentSeason === 0 || currentWeek === 0) {
        revalidatePath("/admin_utility")
        return { error: `Error: the season/week need to be set to a value greater than 0 before users can be created` }
    }

    let sql = "SELECT season_number FROM Weeks WHERE season_number = ? AND week_number = ?";
    const dbConnection = await global["dbConnection"].getConnection()
    const [queryResult] = await dbConnection.execute(sql, [currentSeason, currentWeek])

    if (queryResult.length === 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: the season/week need to be set to a value greater than 0 before users can be created.` }
    }

    let username = formData.get("username")
    let password = formData.get("password")
    let userType = formData.get("userType")
    let group = formData.get("group")
    let groupNumber = formData.get("groupNumber")
    const fileInput = formData.get("fileInput") as File

    // single user
    if (username && password && userType && group && groupNumber) {
        username = String(username).trim().replace(/[^a-zA-Z0-9]/, "").toLowerCase()
        password = String(password)
        userType = String(userType).toLowerCase()
        group = String(group).toUpperCase()
        groupNumber = String(groupNumber)

        if (isNaN(parseInt(groupNumber))) {
            revalidatePath("/admin_utility")
            return { error: "Error: group number must be a number" }
        }

        if (userType !== "user" && userType !== "admin") {
            revalidatePath("/admin_utility")
            return { error: "Error: user type must be either user or admin" }
        }

        if (password.length > 255) {
            revalidatePath("/admin_utility")
            return { error: "Error: password must be 255 characters or less" }
        }

        if (!password.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/)) {
            revalidatePath("/admin_utility")
            return { error: "Error: password must contain at least 6 characters, 1 uppercase letter and 1 number" }
        }

        sql = "SELECT username FROM PlayerAuth WHERE username = ?";
        const dbConnection = await global["dbConnection"].getConnection()
        const [queryResult] = await dbConnection.execute(sql, [username])

        if (queryResult.length > 0) {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: username already exists." }
        }

        const salt = await genSalt()
        const hashed_password = await hash(password, salt)
        sql = "INSERT IGNORE INTO PlayerAuth (type, username, password) VALUES (?, ?, ?)";
        await dbConnection.execute(sql, [userType, username, hashed_password])

        sql = "SELECT auth_id FROM PlayerAuth WHERE username = ?";
        const [[{ "auth_id": auth_id }]] = await dbConnection.execute(sql, [username])

        sql = "INSERT IGNORE INTO Players (player_id, name, gp, group_number) VALUES (?, ?, ?, ?)";
        await dbConnection.execute(sql, [auth_id, username, group, groupNumber])

        dbConnection.release()
        revalidatePath("/admin_utility")
        return { message: `Successfully created user ${username}` }
    }
    // user(s) from file
    else if (fileInput) {
        const text = await fileInput.text()
        const type = fileInput.type

        if (type !== "text/plain" && type !== "text/csv") {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: invalid file format. Only .txt and .csv files are allowed" }
        }

        if (text === "") {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: file cannot be emtpy" }
        }

        const lines = text.trim().split(/\r?\n|\r/)
        let skippedLines = [] as String[]
        let successfulEntires = 0
        const createdUsers = []
        const createTempUserSql = "INSERT INTO TempPlayerAuth (type, username, password, sha256) VALUES ";
        const createTempValues = [] as String[]
        const createPlayerSql = "INSERT IGNORE INTO Players (player_id, name, gp, group_number) VALUES ";
        const createPlayerValues = [] as String[]

        //username,password,gp,type,group_number
        for (let line of lines) {
            if (line.match(/^[a-zA-Z0-9]+\s*,\s*[a-zA-Z0-9]+\s*,\s*[a-zA-Z0-9]+\s*,\s*(admin|user)\s*,\s*[0-9]+\s*$/)) {
                const userData = line.split(",")
                const username = userData[0].toLowerCase()
                const password = userData[1]

                if (!password.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/)) {
                    skippedLines.push(`Line: ${line} (password must contain at least 6 characters, 1 uppercase letter and 1 number)<br/>`)
                    continue
                }

                const salt = await genSalt()
                const hashed_password = await hash(password, salt)
                const group = userData[2].toUpperCase()
                const userType = userData[3].toLowerCase()
                const groupNumber = userData[4]

                if (isNaN(parseInt(groupNumber))) {
                    skippedLines.push(`Line: ${line} (group number must be a number)`)
                    continue
                }

                if (!createdUsers[username]) {
                    createdUsers[username] = {
                        "username": username,
                        "password": hashed_password,
                        "type": userType,
                        "group": group,
                        "groupNumber": groupNumber,
                        "authID": null
                    }
                    createTempValues.push(`('${userType}', '${username}', '${hashed_password}', '0')`)
                }
            } else {
                skippedLines.push(`Line: ${line} (invalid format)<br/>`)
            }
        }

        if (Object.keys(createdUsers).length > 0) {
            sql = "TRUNCATE TABLE TempPlayerAuth"
            await dbConnection.execute(sql)

            const batchSize = 1000000
            for (let i = 0; i < createTempValues.length; i += batchSize) {
                const batch = createTempValues.slice(i, i + batchSize)
                const sql = createTempUserSql + batch.join()
                await dbConnection.execute(sql)
            }

            // identify users to be inserted that already exist
            sql = `SELECT ta.username
                    FROM TempPlayerAuth ta
                    LEFT JOIN PlayerAuth pa
                    ON ta.username = pa.username
                    WHERE pa.username IS NOT NULL`
            const [duplicateUsers] = await dbConnection.execute(sql)
            if (duplicateUsers.length > 0) {
                for (let row of duplicateUsers) {
                    const existingUser = row["username"]
                    skippedLines.push(`${existingUser} (username already exists)<br/>`)
                }
            }

            // insert new players
            sql = `INSERT IGNORE INTO PlayerAuth (type, username, password, sha256)
                    SELECT ta.type, ta.username, ta.password, 0
                    FROM TempPlayerAuth ta
                    LEFT JOIN PlayerAuth pa ON ta.username = pa.username
                    WHERE pa.username IS NULL`
            await dbConnection.execute(sql)

            // get auth_id from inserts
            sql = `SELECT username, auth_id, sha256
                    FROM PlayerAuth
                    WHERE (username) IN (
                        SELECT username
                        FROM TempPlayerAuth
                    )`

            const [auth_ids] = await dbConnection.execute(sql)

            if (auth_ids.length > 0) {
                for (let row of auth_ids) {
                    const user = row["username"]
                    const authID = row["auth_id"]
                    createdUsers[user]["auth_id"] = authID
                    const group = createdUsers[user]["group"]
                    const groupNumber = createdUsers[user]["groupNumber"]
                    createPlayerValues.push(`('${authID}', '${user}', '${group}', '${groupNumber}')`)
                    successfulEntires++
                }
            }

            // empty out temp inserts after processing users
            sql = "TRUNCATE TABLE TempPlayerAuth"
            await dbConnection.execute(sql)

            // start batch sql insers
            for (let i = 0; i < createPlayerValues.length; i += batchSize) {
                const batch = createPlayerValues.slice(i, batchSize)
                const sql = createPlayerSql + batch.join()
                await dbConnection.execute(sql)
            }
        }

        dbConnection.release()
        revalidatePath("/admin_utility")

        if (skippedLines.length === 0) {
            return { message: "All users from file created" }
        } else {
            if (successfulEntires > 0) {
                const skippedLinesString = skippedLines.join("")
                return { error: `Error: some users not created<br/>${skippedLinesString}` }
            } else {
                const skippedLinesString = skippedLines.join("")
                return { error: `Error: no users created<br/>${skippedLinesString}` }
            }
        }
    } else {
        return { error: "not every required input was filled" }
    }
}

async function deleteUser(formData: FormData) {
    await handleDatabaseConnection()
    // single deletion
    const dbConnection = await global["dbConnection"].getConnection()
    let sql = "" as string
    if (formData.get("username")) {
        const username = formData.get("username")
        sql = "SELECT auth_id, is_active FROM PlayerAuth WHERE username = ?"
        const [authIDRow] = await dbConnection.execute(sql, [username])

        if (authIDRow.length === 0) {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: user does not exist" }
        }

        const isActive = authIDRow[0]["is_active"]
        if (isActive === 0) {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: user is already set as inactive" }
        }

        const authID = authIDRow[0]["auth_id"]

        if (formData.get("hardDelete")) {
            sql = "DELETE FROM PlayerAuth WHERE auth_id = ?"
            await dbConnection.execute(sql, [authID])
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { message: `Successfully deleted ${username}` }
        }

        sql = "UPDATE PlayerAuth SET is_active = ? WHERE auth_id = ?"
        await dbConnection.execute(sql, ['0', authID])
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { message: `Successfully set ${username} as inactive` }
    } else if (formData.get("fileInput")) {
        const file = formData.get("fileInput") as File

        if (file.type !== "text/plain" && file.type !== "text/csv") {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: invalid file format. Only .txt and .csv files are allowed" }
        }

        const fileText = await file.text()

        if (fileText === "") {
            dbConnection.release()
            revalidatePath("/admin_utility")
            return { error: "Error: file cannot be empty" }
        }

        sql = "TRUNCATE TABLE TempPlayerAuth"
        await dbConnection.execute(sql)

        const skippedLines = [] as String[]
        let successfulEntires = 0
        const deletedUsers = []
        const createTempUserSql = "INSERT INTO TempPlayerAuth (username, is_active) VALUES ";
        const createTempValues = []
        const deleteUserSql = "DELETE FROM PlayerAuth WHERE username IN";
        const deleteUserValues = []
        const batchSize = 1000000;
        const users = fileText.split(",")

        for (let user of users) {
            user = user.trim()
            if (user && !deletedUsers[user]) {
                deletedUsers[user] = user
                createTempValues.push(`('${user}', '0')`)
            }
        }


        for (let i = 0; i < createTempValues.length; i += batchSize) {
            const batch = createTempValues.slice(i, i + batchSize)
            const sql = createTempUserSql + batch.join()
            await dbConnection.execute(sql)
        }

        sql = `SELECT ta.username
            FROM TempPlayerAuth ta
            LEFT JOIN PlayerAuth pa
            ON ta.username = pa.username
            WHERE pa.username IS NULL`

        const [nonExistingUsers] = await dbConnection.execute(sql)
        for (let i = 0; i < nonExistingUsers.length; i++) {
            const user = nonExistingUsers[i].username
            skippedLines.push(`${user} (user doesn't exist)<br/>`)
            if (deletedUsers[user]) {
                delete deletedUsers[user]
            }
        }

        for (let user of Object.keys(deletedUsers)) {
            deleteUserValues.push(`'${deletedUsers[user]}'`)
            successfulEntires++
        }

        if (formData.get("hardDelete")) {
            for (let i = 0; i < deleteUserValues.length; i += batchSize) {
                const batch = deleteUserValues.slice(i, i + batchSize)
                const sql = `${deleteUserSql} (${batch.join()})`
                await dbConnection.execute(sql)
            }
        } else {
            sql = `UPDATE PlayerAuth AS pa
                        JOIN TempPlayerAuth AS ta ON pa.username = ta.username
                        SET pa.is_active = ta.is_active`
            await dbConnection.execute(sql)
        }

        dbConnection.release()
        revalidatePath("/admin_utility")
        const operation = formData.get("hardDelete") ? "hard deleted" : "soft deleted"
        if (skippedLines.length === 0) {
            return { message: `All users from file ${operation}` }
        } else if (skippedLines.length > 0 && successfulEntires > 0) {
            return { error: `Some users from file were not ${operation}. Skipped lines:<br/>${skippedLines.join("")}` }
        } else {
            return { error: `No users from file ${operation}. Skipped lines:<br/>${skippedLines.join("")}` }
        }

    } else {
        return { error: "not every required input was filled" }
    }
}

async function uploadGames(formData: FormData) {
    await handleDatabaseConnection()
    const fileInput = formData.get("fileInput") as File

    if (!fileInput) {
        revalidatePath("/admin_utility")
        return { error: "Error: file cannot be empty" }
    }

    if (fileInput.type !== "text/plain" && fileInput.type !== "text/csv") {
        revalidatePath("/admin_utility")
        return { error: "Error: invalid file format. Only .txt and .csv files are allowed" }
    }

    const fileText = await fileInput.text()

    if (fileText === "") {
        revalidatePath("/admin_utility")
        return { error: "Error: file cannot be empty" }
    }

    const currentSeason = process.env.CURRENT_SEASON
    const currentWeek = process.env.CURRENT_WEEK

    if (currentSeason === "0" || currentWeek === "0") {
        revalidatePath("/admin_utility")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before games can be created" }
    }

    const timerPaused = process.env.TIMER_PAUSED === "1" ? true : false
    const now = Date.now()
    const timerTime = Number(process.env.TARGET_RESET_TIME)

    if (now < timerTime && !timerPaused) {
        revalidatePath("/admin_utility")
        return { error: "Error: the timer needs to be paused or negative before games can be created." }
    }

    const dbConnection = await global["dbConnection"].getConnection()

    let sql = "SELECT * FROM Weeks WHERE season_number = ? AND week_number = ?"
    const [queryResult] = await dbConnection.execute(sql, [currentSeason, currentWeek])
    if (queryResult.length === 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before games can be created." }
    }

    const teamIDs = {
        "Bills": 4, "Rams": 19, "Dolphins": 20, "Patriots": 22,
        "Eagles": 26, "Lions": 11, "Niners": 28, "49ers": 28,
        "Bears": 6, "Cmdrs": 33, "Jags": 15, "Jaguars": 15,
        "Panthers": 5, "Browns": 8, "Colts": 14, "Texans": 13,
        "Bengals": 7, "Steelers": 27, "Saints": 23, "Falcons": 2,
        "Ravens": 3, "Jets": 25, "Chargers": 18, "Raiders": 17,
        "Packers": 12, "Vikings": 21, "Chiefs": 16, "Cardinals": 1,
        "Titans": 31, "Giants": 24, "Bucs": 30, "Cowboys": 9,
        "Broncos": 10, "Seahawks": 29, "WFT": 33, "Redskins": 33, "Push": 32
    }

    const createGamesSql = "INSERT IGNORE INTO Games (season_number, week_number, favorite, spread, underdog) VALUES "
    const createGamesValues = []
    const skippedLines = []
    let successfulEntries = 0

    const fileTextByLine = fileText.trim().split(/\r?\n|\r/)
    for (let i = 3; i < fileTextByLine.length; i++) {
        const line = fileTextByLine[i].split(",")
        const lineEmpty = line.every(entry => entry.trim() === "")
        if (line.length >= 5 && !lineEmpty) {
            const gameNumber = Number(line[0])
            const favorite = line[2].trim()
            const spread = Number(line[3].trim())
            const underdog = line[4].trim()

            if (!gameNumber || !favorite || isNaN(spread) || !underdog) {
                skippedLines.push(`${line} (invalid format)<br/>game number incorrect: ${!gameNumber} favorite incorrect: ${!favorite} spread incorrect: ${isNaN(spread)} underdog incorrect: ${!underdog}<br/>`)
                continue
            }

            if (!["Bye", "Omitted"].includes(favorite) && !["Bye", "Omitted"].includes(underdog)) {
                if (!teamIDs[favorite]) {
                    skippedLines.push(`${line} favorite ${favorite} does not exist as a team in the database<br/>`)
                    continue
                } else if (!teamIDs[underdog]) {
                    skippedLines.push(`${line} favorite ${favorite} does not exist as a team in the database<br/>`)
                    continue
                } else {
                    const favoriteID = teamIDs[favorite];
                    const underdogID = teamIDs[underdog];
                    createGamesValues.push(`('${currentSeason}', '${currentWeek}', '${favoriteID}', '${spread}', '${underdogID}')`);
                    successfulEntries++;
                }
            }
        }
    }

    if (skippedLines.length > 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: (need to reprocess) some games not created, skipped lines:<br/>${skippedLines.join("")}` }
    }

    // clear previously set picks
    sql = `DELETE FROM PlayerSelections
     WHERE game_id IN (
         SELECT game_id
         FROM Games
         WHERE season_number = ? AND week_number = ?
     )`
    await dbConnection.execute(sql, [currentSeason, currentWeek])

    // clear previously set games
    sql = `DELETE FROM Games WHERE season_number = ? AND week_number = ?`
    await dbConnection.execute(sql, [currentSeason, currentWeek])

    const batchSize = 1000000
    for (let i = 0; i < createGamesValues.length; i += batchSize) {
        const batch = createGamesValues.slice(i, i + batchSize)
        const sql = createGamesSql + batch.join()
        await dbConnection.execute(sql)
    }

    dbConnection.release()
    revalidatePath("/admin_utility")
    return { message: "All games from file created" }
}

async function handleWeekResults(formData: FormData) {
    await handleDatabaseConnection()
    const fileInput = formData.get("fileInput") as File

    if (!fileInput) {
        revalidatePath("/admin_utility")
        return { error: "Error: file cannot be empty" }
    }

    if (fileInput.type !== "text/plain" && fileInput.type !== "text/csv") {
        revalidatePath("/admin_utility")
        return { error: "Error: invalid file format. Only .txt and .csv files are allowed" }
    }

    const fileText = await fileInput.text()

    if (fileText === "") {
        revalidatePath("/admin_utility")
        return { error: "Error: file cannot be empty" }
    }

    const currentSeason = process.env.CURRENT_SEASON
    const currentWeek = process.env.CURRENT_WEEK

    if (currentSeason === "0" || currentWeek === "0") {
        revalidatePath("/admin_utility")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before games can be created" }
    }

    const timerPaused = process.env.TIMER_PAUSED === "1" ? true : false
    const now = Date.now()
    const timerTime = Number(process.env.TARGET_RESET_TIME)

    if (now < timerTime && !timerPaused) {
        revalidatePath("/admin_utility")
        return { error: "Error: the timer needs to be paused or negative before games can be created." }
    }

    const dbConnection = await global["dbConnection"].getConnection()

    let sql = "SELECT * FROM Weeks WHERE season_number = ? AND week_number = ?"
    const [queryResult] = await dbConnection.execute(sql, [currentSeason, currentWeek])
    if (queryResult.length === 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before games can be created." }
    }

    sql = "SELECT COUNT(game_id) AS game_count FROM Games WHERE season_number = ? AND week_number = ?"
    const [gameCount] = await dbConnection.execute(sql, [currentSeason, currentWeek])
    if (gameCount.length === 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: no games are available for week ${currentWeek} of season ${currentSeason}` }
    }

    sql = "TRUNCATE TABLE TempGames"
    await dbConnection.execute(sql)

    const teamIDs = {
        "Bills": 4, "Rams": 19, "Dolphins": 20, "Patriots": 22,
        "Eagles": 26, "Lions": 11, "Niners": 28, "49ers": 28,
        "Bears": 6, "Cmdrs": 33, "Jags": 15, "Jaguars": 15,
        "Panthers": 5, "Browns": 8, "Colts": 14, "Texans": 13,
        "Bengals": 7, "Steelers": 27, "Saints": 23, "Falcons": 2,
        "Ravens": 3, "Jets": 25, "Chargers": 18, "Raiders": 17,
        "Packers": 12, "Vikings": 21, "Chiefs": 16, "Cardinals": 1,
        "Titans": 31, "Giants": 24, "Bucs": 30, "Cowboys": 9,
        "Broncos": 10, "Seahawks": 29, "WFT": 33, "Redskins": 33, "Push": 32
    }

    const createTempGamesSql = "INSERT IGNORE INTO TempGames (season_number, week_number, favorite, underdog, winner, favorite_score, underdog_score) VALUES "
    const createTempValues = [] as String[]
    const skippedLines = [] as String[]
    const createdGames = {}

    const fileTextByLine = fileText.trim().split(/\r?\n|\r/)
    for (let i = 3; i < fileTextByLine.length; i++) {
        const line = fileTextByLine[i].split(",").filter(text => text !== "")
        const lineEmpty = line.every(entry => entry.trim() === "")
        if (line.length >= 9 && !lineEmpty) {
            const favoriteScore = Number(line[1].trim())
            const favorite = line[2].trim()
            const spread = Number(line[3].trim())
            const underdog = line[4].trim()
            const underdogScore = Number(line[5].trim())

            if (isNaN(favoriteScore) || !favorite || isNaN(spread) || !underdog || isNaN(underdogScore)) {
                skippedLines.push(`${line} (invalid format)<br/> favorite score not number: ${isNaN(favoriteScore)} favorite team doesn't exist ${!favorite} spread not number: ${isNaN(spread)} underdog team doesn't exist ${!underdog} underdog score not number ${isNaN(underdogScore)}<br/>`)
                continue
            }

            if (!["Bye", "Omitted"].includes(favorite) && !["Bye", "Omitted"].includes(underdog)) {
                if (!teamIDs[favorite]) {
                    skippedLines.push(`${line} favorite ${favorite} does not exist as a team in the database<br/>`)
                    continue
                } else if (!teamIDs[underdog]) {
                    skippedLines.push(`${line} favorite ${favorite} does not exist as a team in the database<br/>`)
                    continue
                } else {
                    let winner = ""
                    if (favoriteScore - underdogScore > spread) {
                        winner = favorite
                    } else if (favoriteScore < underdogScore || favoriteScore - underdogScore < spread) {
                        winner = underdog
                    } else {
                        winner = "Push"
                    }

                    if (!createdGames[favorite]) {
                        createdGames[favorite] = { underdog: underdog, winner: winner }
                        const favoriteID = teamIDs[favorite];
                        const underdogID = teamIDs[underdog];
                        const winnerID = teamIDs[winner]
                        createTempValues.push(`('${currentSeason}', '${currentWeek}', '${favoriteID}', '${underdogID}', '${winnerID}', '${spread}', '${underdogID}')`);
                    }
                }
            }
        }
    }

    if (Object.keys(createdGames).length > 0) {
        const batchSize = 1000000;

        for (let i = 0; i < createTempValues.length; i += batchSize) {
            const batch = createTempValues.slice(i, i + batchSize)
            const sql = createTempGamesSql + batch.join()
            await dbConnection.execute(sql)
        }

        // identify which games don't exist
        sql = `SELECT tg.favorite, tg.underdog
            FROM TempGames tg
            LEFT JOIN Games g
            ON tg.season_number = g.season_number
            AND tg.week_number = g.week_number
            AND tg.favorite = g.favorite
            AND tg.underdog = g.underdog
            WHERE g.game_id IS NULL
            AND tg.season_number = ?
            AND tg.week_number = ?`

        const [nonexistentGames] = await dbConnection.execute(sql, [currentSeason, currentWeek])
        for (let row of nonexistentGames) {
            const favorite = row["favorite"]
            const underdog = row["underdog"]
            skippedLines.push(`line with favorite: ${favorite} and underdog: ${underdog} (game doesn't exist)<br/>`)
        }

        // set winning teams and scores for all games that exist
        sql = `UPDATE Games g
            JOIN TempGames tg
            ON g.season_number = tg.season_number
            AND g.week_number = tg.week_number
            AND g.favorite = tg.favorite
            AND g.underdog = tg.underdog
            SET g.winner = tg.winner,
            g.favorite_score = tg.favorite_score,
            g.underdog_score = tg.underdog_score
            WHERE g.winner IS NULL
            AND tg.winner IS NOT NULL
            AND g.season_number = ?
            AND g.week_number = ? `
        await dbConnection.execute(sql, [currentSeason, currentWeek])

        //log the successful insertions
        sql = `SELECT g.week_number, g.season_number, g.favorite, g.underdog
            FROM Games g
            JOIN TempGames tg
            ON g.week_number = tg.week_number
            AND g.season_number = tg.season_number
            AND g.favorite = tg.favorite
            AND g.underdog = tg.underdog`
        const [insertedGames] = await dbConnection.execute(sql)

        if (insertedGames.length !== Object.keys(createdGames).length) {
            revalidatePath("/admin_utility")
            return { error: `Error: the number of game results to update does not match the number of games for the week (need to reprocess)<br/>Skipped lines: ${skippedLines.join("")}` }
        }

        const message = [] as String[]
        message.push("All games winners/scores processed<br/>")

        sql = "INSERT IGNORE INTO Weeks (season_number, week_number) VALUES (?, ?)"
        const weekNumber = Number(currentWeek) + 1
        const [insertWeek] = await dbConnection.execute(sql, [currentSeason, weekNumber])
        if (insertWeek.affectedRows > 0) {
            message.push(`Inserted week entry for next week ${weekNumber}<br/>`)
        }

        // insert playerstats entry for next week for players who have not made selections
        sql = `INSERT IGNORE INTO PlayerWeekStats (player_id, gp, group_number, season_number, week_number, rank, won, lost, played, win_percentage)
            SELECT
                p.player_id,
                p.gp,
                p.group_number,
                ? AS season_number,
                ? AS week_number, -- next week
                COALESCE(pws.rank, 0) AS rank,
                COALESCE(pws.won, 0) AS won,
                COALESCE(pws.lost, 0) + ? AS lost,
                COALESCE(pws.played, 0) + ? AS played,
                COALESCE(pws.won, 0) / (COALESCE(pws.played, 0) + ?) AS win_percentage
            FROM Players p
            LEFT JOIN PlayerWeekStats pws ON p.player_id = pws.player_id AND pws.season_number = ? AND pws.week_number = ?
            WHERE p.player_id IN (
                SELECT pws.player_id
                FROM PlayerWeekStats pws
                WHERE pws.season_number = ? AND pws.week_number = ?
            )
            AND p.player_id NOT IN (
                SELECT ps.player_id
                FROM PlayerSelections ps
                JOIN Games g ON ps.game_id = g.game_id
                WHERE g.season_number = ? AND g.week_number = ?
            )`

        const maxPicks = Math.min(gameCount[0].game_count, 6)
        console.log(`max picks is ${maxPicks}`)
        const [playersWithNoPicks] = await dbConnection.execute(sql, [currentSeason, weekNumber, maxPicks, maxPicks, maxPicks, currentSeason, currentWeek, currentSeason, currentWeek, currentSeason, currentWeek])
        if (playersWithNoPicks.affectedRows > 0) {
            message.push(`Created new player week stat entries for players who did not make selections for week ${currentWeek}<br/>`)
        }

        // insert playerweekstats entries for players who did make selections
        sql = `INSERT IGNORE INTO PlayerWeekStats (player_id, gp, group_number, season_number, week_number, rank, won, lost, played, win_percentage)
        SELECT
            pws.player_id,
            p.gp,
            p.group_number,
            ?, -- current season_number
            ?, -- next week_number
            pws.rank,
            COALESCE(pws.won, 0) + week_data.won,
            COALESCE(pws.lost, 0) +  ? - week_data.won - week_data.cancelled, -- minimum required selections
            COALESCE(pws.played, 0) + ? - week_data.cancelled,
        CASE WHEN (COALESCE(pws.played, 0) + ? - week_data.cancelled) > 0 THEN (COALESCE(pws.won, 0) + week_data.won) / (COALESCE(pws.played, 0) + ? - week_data.cancelled) ELSE 0 END
        FROM PlayerWeekStats pws
        LEFT JOIN (
            SELECT
                ps.player_id,
                SUM(CASE WHEN g.winner = ps.selected_team_id THEN 1 ELSE 0 END) AS won,
                SUM(CASE WHEN g.winner IS NULL THEN 1 ELSE 0 END) as cancelled
            FROM PlayerSelections ps
            JOIN Games g ON ps.game_id = g.game_id
            WHERE g.season_number = ? -- current season_number
                AND g.week_number = ? -- current week_number
            GROUP BY ps.player_id
        ) AS week_data ON pws.player_id = week_data.player_id
        JOIN Players p ON pws.player_id = p.player_id
        WHERE pws.season_number = ? -- current season_number
            AND pws.week_number = ?`

        const [playersWithPicks] = await dbConnection.execute(sql, [currentSeason, weekNumber, maxPicks, maxPicks, maxPicks, maxPicks, currentSeason, currentWeek, currentSeason, currentWeek])

        if (playersWithPicks.affectedRows > 0) {
            message.push(`Created new player week stats entries for next week week $weekNumber who have made selections<br/>`)
        }

        //update ranks for next week weekstats
        sql = `UPDATE PlayerWeekStats pws
            JOIN (
              SELECT
                p1.player_id,
                p1.season_number,
                p1.week_number,
                p1.won,
                p1.lost,
                p1.played,
                p1.win_percentage,
                (
                  SELECT COUNT(*) + 1
                  FROM PlayerWeekStats p2
                  WHERE p2.season_number = p1.season_number
                    AND p2.week_number = p1.week_number
                    AND p2.win_percentage > p1.win_percentage
                ) AS new_rank
              FROM PlayerWeekStats p1
              WHERE p1.season_number = ?
                AND p1.week_number = ?    
            ) AS new_stats ON pws.player_id = new_stats.player_id
            AND pws.season_number = new_stats.season_number
            AND pws.week_number = new_stats.week_number
            SET pws.rank = new_stats.new_rank;`

        const [nextWeekRanks] = await dbConnection.execute(sql, [currentSeason, weekNumber])

        if (nextWeekRanks.affectedRows > 0) {
            message.push(`Updated player ranks for next weeks stats week ${weekNumber}<br/>`)
        }

        //update playerseasonstats
        sql = `UPDATE PlayerSeasonStats pss
            JOIN (
                SELECT
                    pws.player_id,
                    pws.season_number,
                    pws.won,
                    pws.lost,
                    pws.played,
                    pws.rank,
                    CASE WHEN pws.played > 0 THEN pws.won / pws.played ELSE 0 END AS win_percentage
                FROM PlayerWeekStats pws
                WHERE pws.season_number = ?
                    AND pws.week_number = ? -- next week_number
            ) AS week_data ON pss.player_id = week_data.player_id AND pss.season_number = week_data.season_number
            SET
                pss.won = week_data.won,
                pss.lost = week_data.lost,
                pss.played = week_data.played,
                pss.rank = week_data.rank,
                pss.win_percentage = week_data.win_percentage
            WHERE
                pss.season_number = ?`

        const [seasonStats] = await dbConnection.execute(sql, [currentSeason, weekNumber, currentSeason])

        if (seasonStats.affectedRows > 0) {
            message.push(`Updated player season stats entries for sesaon ${currentSeason}<br/>`)
        }

        //insert winners
        sql = `INSERT IGNORE INTO Winners (player_id, season_number, week_number)
        SELECT subquery.player_id, ?, ? 
        FROM (
            SELECT ps.player_id,
                SUM(CASE WHEN g.winner IS NULL THEN 0
                            WHEN ps.selected_team_id = g.winner THEN 1
                            ELSE 0 END) AS games_won,
                SUM(CASE WHEN g.winner IS NULL THEN 1 ELSE 0 END) as cancelled
            FROM PlayerSelections ps
            INNER JOIN Games g ON ps.game_id = g.game_id
            LEFT JOIN Teams t ON g.winner = t.team_id
            WHERE g.season_number = ? AND g.week_number = ?
            GROUP BY ps.player_id
            HAVING (games_won = ? - cancelled)
        ) AS subquery`

        const [winners] = await dbConnection.execute(sql, [currentSeason, currentWeek, currentSeason, currentWeek, maxPicks])

        if (winners.affectedRows > 0) {
            message.push(`Inserted winners for week ${currentWeek}<br/>`)
        }

        //insert losers who have made selections
        sql = `INSERT IGNORE INTO Losers (player_id, season_number, week_number)
            SELECT subquery.player_id, ?, ? 
            FROM (
                SELECT ps.player_id,
                       SUM(CASE WHEN g.winner IS NULL THEN 0
                                WHEN ps.selected_team_id != g.winner THEN 1
                                ELSE 0 END) AS games_lost
                FROM PlayerSelections ps
                INNER JOIN Games g ON ps.game_id = g.game_id
                INNER JOIN Teams t ON g.winner = t.team_id
                WHERE g.season_number = ? AND g.week_number = ?
                GROUP BY ps.player_id
                HAVING (games_lost = ? AND games_lost > 0) 
            ) AS subquery`

        const [losersWithPicks] = await dbConnection.execute(sql, [currentSeason, currentWeek, currentSeason, currentWeek, maxPicks])
        if (losersWithPicks.affectedRows > 0) {
            message.push(`Inserted losers for week ${currentWeek}<br/>`)
        }

        //insert losers who have not made selections
        sql = `INSERT IGNORE INTO Losers (player_id, season_number, week_number)
            SELECT
                ps.player_id,
                ? AS season_number,
                ? AS week_number
            FROM PlayerSeasonStats ps
            WHERE ps.season_number = ? 
              AND ps.player_id NOT IN (
                SELECT DISTINCT ps2.player_id
                FROM PlayerSelections ps2
                INNER JOIN Games g ON ps2.game_id = g.game_id
                WHERE g.week_number = ? 
                  AND g.season_number = ?
            );`

        const [losersWithNoPicks] = await dbConnection.execute(sql, [currentSeason, currentWeek, currentSeason, currentWeek, currentSeason])

        if (losersWithNoPicks.affectedRows > 0) {
            message.push(`Inserted losers for week ${currentWeek} who didn't make selections<br/>`)
        }

        // insert new week entry
        sql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES (?, ?)"
        const [newWeek] = await dbConnection.execute(sql, [currentSeason, weekNumber])
        if (newWeek.affectedRows > 0) {
            message.push(`Inserted a new week entry for week ${weekNumber}<br/>`)
        }

        // update week env
        setEnvValue("CURRENT_WEEK", weekNumber)
        message.push(`Updated the current week to the next week ${weekNumber}<br/>`)
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { message: message.join("") }
    } else {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: game results from file could not be parsed.<br/>Skipped lines: ${skippedLines.join("")}` }
    }
}

async function uploadPicks(formData: FormData) {
    const file = formData.get("fileInput") as File

    if (!file) {
        revalidatePath("/admin_utility")
        return { error: "Error: no file found" }
    }

    if (file.type !== "text/plain" && file.type !== "text/csv") {
        revalidatePath("/admin_utility")
        return { error: "Error: invalid file format. Only .txt and .csv files are allowed" }
    }

    const fileText = await file.text()

    if (fileText === "") {
        revalidatePath("/admin_utility")
        return { error: "Error: file cannot be empty" }
    }

    const currentSeason = process.env.CURRENT_SEASON
    const currentWeek = process.env.CURRENT_WEEK

    if (currentSeason === "0" || currentWeek === "0") {
        revalidatePath("/admin_utility")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before picks can be uploaded." }
    }

    await handleDatabaseConnection()
    const dbConnection = await global["dbConnection"].getConnection()

    // ensure week/season entry exists in database
    let sql = "SELECT * FROM Weeks WHERE season_number = ? AND week_number = ?"
    const [queryResult] = await dbConnection.execute(sql, [currentSeason, currentWeek])
    if (queryResult.length === 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: "Error: the week/season needs to be set to a value greater than 0 before games can be created." }
    }

    // get games for the week
    const gamesArray = []
    sql = `SELECT
        g.game_id,
        t1.team_id AS favorite,
        t2.team_id AS underdog
        FROM
        (SELECT * FROM Games WHERE week_number = ? AND season_number = ? ORDER BY game_id) AS g
        JOIN
        Teams t1 ON g.favorite = t1.team_id
        JOIN
        Teams t2 ON g.underdog = t2.team_id`
    const [weekGamesQuery] = await dbConnection.execute(sql, [currentWeek, currentSeason])

    if (weekGamesQuery.length > 0) {
        for (let row of weekGamesQuery) {
            const favoriteID = row["favorite"]
            const underdogID = row["underdog"]
            const gameID = row["game_id"]
            gamesArray[favoriteID] = gameID
            gamesArray[underdogID] = gameID
        }
    } else {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: no games have been uploaded for week ${currentWeek} of season ${currentSeason}` }
    }

    const createdUsers = []
    const createTempUserSql = "INSERT INTO TempPlayerAuth (username, password, sha256) VALUES ";
    const createTempUserValues = [];
    const createPlayerSql = "INSERT IGNORE INTO Players (player_id, name, gp, group_number) VALUES ";
    const createPlayerValues = [];
    const createStatSql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number, rank, won, lost, played, win_percentage, gp, group_number) VALUES ";
    const createStatValues = [];
    const createWeekStatSql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number, rank, won, lost, played, win_percentage, gp, group_number) VALUES ";
    const createWeekStatValues = [];
    const skippedLines = []

    const fileTextByLine = fileText.trim().split(/\r?\n|\r/)
    const firstLine = fileTextByLine[0].split(",").filter(text => text !== "")
    for (let i = 1; i < fileTextByLine.length; i++) {
        const line = fileTextByLine[i].split(",").filter(text => text !== "")
        if (line.length >= firstLine.length) {
            const groupNumber = line[0]

            if (isNaN(parseInt(groupNumber))) {
                skippedLines.push(`found invalid group number for player ${line[2]}<br/>`)
                continue
            }

            const group = line[1]

            if (group.length !== 2) {
                skippedLines.push(`found invalid group not of length 2 for player ${line[2]}<br/>`)
                continue
            }

            const playerName = line[2].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

            if (playerName && !createdUsers[playerName]) {
                const userPassword = randomPassword()
                const salt = await genSalt(1)
                const hashedPassword = await hash(userPassword, salt)
                createdUsers[playerName] = {
                    "authID": null,
                    "username": playerName,
                    "password": userPassword,
                    "group": group,
                    "groupNumber": groupNumber,
                    "new": false
                }
                createTempUserValues.push(`('${playerName}', '${hashedPassword}', '1')`)
            } else {
                skippedLines.push(`player ${line[2]} skipped due to no alphanumeric characters or is a duplicate<br/>`)
                continue
            }
        }
    }

    if (skippedLines.length > 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: need to reprocess picks due to skipped lines:<br/>${skippedLines.join("")}` }
    }

    sql = "TRUNCATE TABLE TempPlayerAuth"
    await dbConnection.execute(sql)

    const batchSize = 1000000
    for (let i = 0; i < createTempUserValues.length; i += batchSize) {
        const batch = createTempUserValues.slice(i, i + batchSize)
        const sql = createTempUserSql + batch.join()
        await dbConnection.execute(sql)
    }

    // mark new players
    const newUsers = []
    sql = `SELECT ta.username FROM TempPlayerAuth ta
        LEFT JOIN PlayerAuth pa ON ta.username = pa.username
        WHERE pa.username IS NULL`
    const [newUsersQuery] = await dbConnection.execute(sql)

    if (currentWeek !== "1" && newUsersQuery.length > 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: found new players after the first week: ${newUsersQuery.map(user => user.username).join(" ")}` }
    }

    for (let row of newUsersQuery) {
        const user = row["username"]
        createdUsers[user]["new"] = true
        const userPassword = createdUsers[user]["password"]
        newUsers.push({ "username": user, "password": userPassword })
    }

    // insert new players
    sql = `INSERT IGNORE INTO PlayerAuth (type, username, password, sha256)
        SELECT 'user', ta.username, ta.password, 1
        FROM TempPlayerAuth ta
        LEFT JOIN PlayerAuth pa ON ta.username = pa.username
        WHERE pa.username IS NULL`
    await dbConnection.execute(sql)

    // get auth id for all newky inserted players
    sql = `SELECT username, auth_id, sha256
        FROM PlayerAuth
        WHERE (username) IN (
            SELECT username
            FROM TempPlayerAuth
        )`
    const [authIDQuery] = await dbConnection.execute(sql)
    for (let row of authIDQuery) {
        const user = row["username"]
        const authID = row["auth_id"]
        createdUsers[user]["authID"] = authID
        const groupNumber = createdUsers[user]["groupNumber"]
        if (createdUsers[user]["new"]) {
            const group = createdUsers[user]["group"]
            createPlayerValues.push(`('${authID}', '${user}', '${group}', '${groupNumber}')`)
            createStatValues.push(`('${authID}', '${currentSeason}', '0', '0', '0', '0', '0', '${group}', '${groupNumber}')`)
            createWeekStatValues.push(`('${authID}', '${currentSeason}', '${currentWeek}', '0', '0', '0', '0', '0', '${group}', '${groupNumber}')`)
        }
    }

    // batch insert new users
    for (let i = 0; i < createPlayerValues.length; i += batchSize) {
        const batch = createPlayerValues.slice(i, i + batchSize)
        const sql = createPlayerSql + batch.join()
        await dbConnection.execute(sql)
    }

    for (let i = 0; i < createStatValues.length; i += batchSize) {
        const batch = createStatValues.slice(i, i + batchSize)
        const sql = createStatSql + batch.join()
        await dbConnection.execute(sql)
    }

    for (let i = 0; i < createWeekStatValues.length; i += batchSize) {
        const batch = createWeekStatValues.slice(i, i + batchSize)
        const sql = createWeekStatSql + batch.join()
        await dbConnection.execute(sql)
    }

    // empty out temp inserts after creating new users
    sql = `TRUNCATE TABLE TempPlayerAuth`
    await dbConnection.execute(sql)

    const teamIDs = {
        "Bills": 4, "Rams": 19, "Dolphins": 20, "Patriots": 22,
        "Eagles": 26, "Lions": 11, "Niners": 28, "49ers": 28,
        "Bears": 6, "Cmdrs": 33, "Jags": 15, "Jaguars": 15,
        "Panthers": 5, "Browns": 8, "Colts": 14, "Texans": 13,
        "Bengals": 7, "Steelers": 27, "Saints": 23, "Falcons": 2,
        "Ravens": 3, "Jets": 25, "Chargers": 18, "Raiders": 17,
        "Packers": 12, "Vikings": 21, "Chiefs": 16, "Cardinals": 1,
        "Titans": 31, "Giants": 24, "Bucs": 30, "Cowboys": 9,
        "Broncos": 10, "Seahawks": 29, "WFT": 33, "Redskins": 33, "Push": 32
    }

    // bulk inserts
    const createPicksSql = "INSERT IGNORE INTO PlayerSelections (player_id, game_id, selected_team_id) VALUES ";
    const createPicksValues = []
    const playerSelections = [] // track duplicates

    for (let i = 1; i < fileTextByLine.length; i++) {
        const line = fileTextByLine[i].split(",").filter(text => text !== "")
        if (line.length >= firstLine.length) {
            const playerName = line[2].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            const pick1 = line[6]?.trim()
            const pick2 = line[7]?.trim()
            const pick3 = line[8]?.trim()
            const pick4 = line[9]?.trim()
            const pick5 = line[10]?.trim()
            const pick6 = line[11]?.trim()

            if (createdUsers[playerName]) {
                const picks = [pick1, pick2, pick3, pick4, pick5, pick6].filter(pick => pick && pick.trim() !== "")

                for (let pick of picks) {
                    // correct cases where pick is not exact team on schedule
                    if (pick === "Jags") {
                        pick = "Jaguars"
                    } else if (pick === "Niners") {
                        pick = "49ers"
                    }
                    const teamID = teamIDs[pick]
                    if (gamesArray[teamID]) {
                        const playerID = createdUsers[playerName]["authID"]
                        const gameID = gamesArray[teamID]
                        // ensure player did not pick more than one team for the same game
                        if (!playerSelections[playerID]) {
                            playerSelections[playerID] = {}
                        }
                        if (!playerSelections[playerID][gameID]) {
                            playerSelections[playerID][gameID] = teamID
                            createPicksValues.push(`('${playerID}', '${gameID}', '${teamID}')`)
                        }
                    }
                }
            }
        }
    }

    if (skippedLines.length > 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: need to reprocess picks due to skipped lines:<br/>${skippedLines.join("")}` }
    }

    if (createPicksValues.length === 0) {
        dbConnection.release()
        revalidatePath("/admin_utility")
        return { error: `Error: no picks were created due to all lines not containing the exact field values` }
    }

    // batch insert picks
    for (let i = 0; i < createPicksValues.length; i += batchSize) {
        const batch = createPicksValues.slice(i, i + batchSize)
        const sql = createPicksSql + batch.join()
        await dbConnection.execute(sql)
    }

    dbConnection.release()

    if (newUsers.length > 0) {
        const csvUserText = newUsers.map(user => `${user.username},${user.password}`).join("\n")
        const file = createWriteStream("user_credentials.csv")
        file.write(csvUserText)
        file.end()
    }

    revalidatePath("/admin_utility")
    return { message: `All picks from file created` }
}

export async function handleAdminForm(prevState: string, formData: FormData) {
    const session = await getSession()

    if (!session) {
        return redirect("/")
    }

    if (session?.user?.type !== "admin") {
        return redirect("/games")
    }

    const option = formData.get("option")
    if (option === "Toggle Timer") {
        return await toggleTimer()
    } else if (option === "Edit Timer") {
        const time = formData.get("time")
        return await setTimer(time)
    } else if (option === "Set Week/Season") {
        const season = formData.get("season")
        const week = formData.get("week")
        return await setSeasonAndWeek(season, week)
    } else if (option === "Insert User") {
        return await insertUser(formData)
    } else if (option === "Delete User") {
        return await deleteUser(formData)
    } else if (option === "Upload Games") {
        return await uploadGames(formData)
    } else if (option === "Upload Picks") {
        return await uploadPicks(formData)
    } else if (option === "Upload Game Results") {
        return await handleWeekResults(formData)
    } else {
        revalidatePath("/admin_utility")
        return { error: "Invalid or unsupported option selected" }
    }
}