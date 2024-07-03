"use server"
//import mysql from "mysql2/promise"
export async function handleDatabaseConnection() {
    return null
    /*try {
        if (!global["dbConnection"]) {
            global["dbConnection"] = mysql.createPool({
                host: process.env.DB_SERVERNAME,
                user: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DBNAME,
                waitForConnections: true,
                connectionLimit: 1000,
                queueLimit: 0
            })

            global["dbConnection"].on("end", () => {
                console.log("db connection ended, reconnecting...")
                handleDatabaseConnection()
            })
        }
    } catch (error) {
        console.error(error)
        throw error
    }*/
}