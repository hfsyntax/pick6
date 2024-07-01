"use client"
import { useState } from "react"
import { getWeekResults } from "../actions/serverRequests"
import Table from './Table'

export default function ResultsHandler({ currentSeason, currentSeasonID, currentWeek, allSeasons, seasonResults }) {
    const [selectedSeason, setSelectedSeason] = useState({ season: currentSeason, id: currentSeasonID })
    const [results, setResults] = useState(seasonResults)

    const handleSelection = async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex]
        const selectedSeasonID = selectedOption.value
        const selectedSeason = selectedOption.getAttribute("data-season")
        setSelectedSeason({ season: selectedSeason, id: selectedSeasonID })
        const weekResults = await getWeekResults(currentSeason, selectedSeason, currentWeek)
        setResults(weekResults)
    }

    return (
        <>
            <div id="select-container">
                <label>Select Week&nbsp;</label>
                <select onChange={handleSelection} defaultValue={selectedSeason.id}>
                    {allSeasons.map((row) => (
                        <option
                            key={row["season_id"]}
                            value={row["season_id"]}
                            data-season={row["season_number"]}
                        >
                            Season {row["season_number"]}
                        </option>
                    ))}
                </select>
            </div>

            <Table
                className={"table-wrapper"}
                headers={["Week #", "0'fers", "Winners"]}
                rows={results}
            />
        </>
    )
}