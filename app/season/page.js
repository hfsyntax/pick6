import { getSeasons, getSeasonStats} from "../../actions/serverRequests";
import { getConfigValue } from "../../lib/configHandler";
import SeasonWeeksHandler from "../../components/SeasonWeeksHandler"

export const metadata = {
    title: "Pick6 - Season",
    description: "Generated by create next app",
}

export default async function Season() {
    const currentSeason = await getConfigValue("CURRENT_SEASON")
    const seasons = await getSeasons()
    const seasonStats = await getSeasonStats(currentSeason, "asc", ["rank"])
    const seasonID = seasons.find(season => season.season_number == currentSeason)?.season_id
    return (
        <div id="container">
            <h1>Pick6 - Season</h1>
            <h1>Season {currentSeason ? currentSeason : "N/A"}</h1>
            {seasons.length > 0 ? <SeasonWeeksHandler
            currentSeason={currentSeason}
            selectedId={seasonID}
            selectOptions={seasons}
            initialData={seasonStats}
            headers={["Rank", "#", "GP", "Player", "Won", "Played", "%"]}
            /> : <h3 style={{color: "red"}}>no data</h3>} 
        </div>
    )
}