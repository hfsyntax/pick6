import { getWeekGameResults, getWeeks } from "../../actions/serverRequests";
import GamesHandler from '../../components/GamesHandler'

export const metadata = {
    title: "Pick6 - Games",
    description: "Generated by create next app",
};

export default async function Games() {
    const currentSeason = process.env.CURRENT_SEASON
    const currentWeek = process.env.CURRENT_WEEK
    const games = []//await getWeekGameResults(currentSeason, currentWeek)
    const weeks = []//await getWeeks()
    const weekID = weeks.find(week => week.season_number == currentSeason && week.week_number == currentWeek)?.week_id
    return (
        <div id="container">
            <h1>Pick6 - Games</h1>
            <h1>Week {currentWeek} of Season {currentSeason}</h1>
            <GamesHandler 
            currentSeason={currentSeason} 
            currentWeek={currentWeek} 
            currentWeekID={weekID}
            weekGames={games} 
            allWeeks={weeks}
            />
        </div>
    )
}
