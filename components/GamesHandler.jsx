"use client"
import { useState } from "react"
import { getWeekGameResults } from "../actions/serverRequests"
import Table from './Table'

export default function GamesHandler({ currentSeason, currentWeek, currentWeekID, allWeeks, weekGames }) {
    const [selectedWeek, setSelectedWeek] = useState({ season: currentSeason, week: currentWeek, id: currentWeekID })
    const [games, setGames] = useState(weekGames)

    const handleSelection = async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex]
        const selectedWeekID = selectedOption.value
        const selectedSeason = selectedOption.getAttribute("data-season")
        const selectedWeek = selectedOption.getAttribute("data-week")
        setSelectedWeek({ season: selectedSeason, week: selectedWeek, id: selectedWeekID })
        const weekGames = await getWeekGameResults(selectedSeason, selectedWeek)
        setGames(weekGames)
    }

    return (
        <>
            <div id="select-container">
                <label>Select Week&nbsp;</label>
                <select onChange={handleSelection} defaultValue={selectedWeek.id}>
                    {allWeeks.map((row) => (
                        <option
                            key={row["week_id"]}
                            value={row["week_id"]}
                            data-season={row["season_number"]}
                            data-week={row["week_number"]}
                        >
                            Week {row["week_number"]} of Season {row["season_number"]}
                        </option>
                    ))}
                </select>
            </div>
            <Table
                className={"table-wrapper"}
                headers={["#", "Pts", "Favorite", "Spread", "Underdog", "Pts", "Covering Team"]}
                rows={games}
            />
        </>
    )
}