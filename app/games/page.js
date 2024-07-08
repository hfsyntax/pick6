import { getWeekGameResults, getWeeks} from "../../actions/serverRequests";
import { getConfigValue } from "../../lib/configHandler";
import SeasonWeeksHandler from "../../components/SeasonWeeksHandler";

export const metadata = {
    title: "Pick6 - Games",
    description: "Generated by create next app",
};

export default async function Games() {
    const currentSeason = await getConfigValue("CURRENT_SEASON")
    const currentWeek = await getConfigValue("CURRENT_WEEK")
    const games = await getWeekGameResults(currentSeason, currentWeek)
    const weeks = await getWeeks()
    const weekID = weeks.find(week => week.season_number == currentSeason && week.week_number == currentWeek)?.week_id
    return (
        <div id="container">
            <h1>Pick6 - Games</h1>
            <h1>Week {currentWeek ? currentWeek : "N/A"} of Season {currentSeason ? currentSeason : "N/A"}</h1>
            {weeks.length > 0 ? <SeasonWeeksHandler
            currentSeason={currentSeason}
            currentWeek={currentWeek}
            selectedId={weekID}
            selectOptions={weeks}
            initialData={games}
            headers={["#", "Pts", "Favorite", "Spread", "Underdog", "Pts", "Covering Team"]}
            /> : <h3 style={{color: "red"}}>no data</h3>}
        </div>
    )
}
