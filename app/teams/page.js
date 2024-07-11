import { getWeekGames, isTimerPaused, calculateTimeUntilReset, getConfigValue } from "../../actions/serverRequests";
import TeamsHandler from "../../components/TeamsHandler"

export const metadata = {
    title: "Pick6 - Teams",
    description: "Generated by create next app",
}

export default async function Teams() {
    const currentSeason = await getConfigValue("CURRENT_SEASON")
    const currentWeek = await getConfigValue("CURRENT_WEEK")
    const weekGames = await getWeekGames(currentSeason, currentWeek)
    const timerPaused = await isTimerPaused()
    const timerTime = await calculateTimeUntilReset()
    return (
        <div id="container">
            <h1>Pick6 - Select Teams</h1>
            {weekGames?.length > 0 && <h1>Week {currentWeek ? currentWeek : "N/A"} of Season {currentSeason ? currentSeason : "N/A"}</h1>}
            {currentSeason && currentWeek ? (<TeamsHandler 
            weekGames={weekGames}
            timerPaused={timerPaused}
            timerTime={timerTime}
            currentSeason={currentSeason}
            currentWeek={currentWeek}
            />) : <h3 style={{color: "red"}}>no data</h3>}
        </div>
    )
}