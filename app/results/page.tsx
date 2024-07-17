import { getSeasons, getWeekResults, getConfigValue } from "../../actions/serverRequests";
import SeasonWeeksHandler from "../../components/SeasonWeeksHandler";

export const metadata = {
    title: "Pick6 - Results",
    description: "Generated by create next app",
}

export default async function results(): Promise<JSX.Element> {
    const currentSeason = await getConfigValue("CURRENT_SEASON")
    const currentWeek = await getConfigValue("CURRENT_WEEK")
    const results = await getWeekResults(currentSeason, currentSeason, currentWeek)
    const seasons = await getSeasons()
    const seasonID = seasons.find(season => season.season_number == currentSeason)?.season_id
    return (
        <div id="container">
            <h1>Pick6 - Results</h1>
            {seasons.length > 0 ? <SeasonWeeksHandler
            currentSeason={currentSeason}
            currentWeek={currentWeek}
            selectedId={seasonID}
            selectOptions={seasons}
            initialData={results}
            headers={["Week #", "0'fers", "Winners"]}
            /> : <h3 style={{color: "red"}}>no data</h3>}
        </div>
    )
}