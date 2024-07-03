import { getSeasons, getWeekResults } from "../../actions/serverRequests";
import ResultsHandler from "../../components/ResultsHandler";

export const metadata = {
    title: "Pick6 - Results",
    description: "Generated by create next app",
}

export default async function results() {
    const currentSeason = process.env.CURRENT_SEASON
    const currentWeek = process.env.CURRENT_WEEK
    const results = []//await getWeekResults(currentSeason, currentSeason, currentWeek)
    const seasons = []//await getSeasons()
    const seasonID = seasons.find(season => season.season_number == currentSeason)?.season_id
    return (
        <div id="container">
            <h1>Pick6 - Results</h1>
            <h1>Season {currentSeason}</h1>
            <ResultsHandler
            currentSeason={currentSeason}
            currentSeasonID={seasonID}
            currentWeek={currentWeek}
            allSeasons={seasons}
            seasonResults={results}
            />
        </div>
    )
}