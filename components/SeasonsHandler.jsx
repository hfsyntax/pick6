"use client"
import { useState } from "react"
import { getSeasonStats } from "../actions/serverRequests"
import Table from './Table'

export default function SeasonsHandler({ currentSeason, currentSeasonID, allSeasons, stats }) {
    const [selectedSeason, setSelectedSeason] = useState({ season: currentSeason, id: currentSeasonID })
    const [results, setResults] = useState(stats)

    const handleSelection = async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex]
        const selectedSeasonID = selectedOption.value
        const selectedSeason = selectedOption.getAttribute("data-season")
        setSelectedSeason({ season: selectedSeason, id: selectedSeasonID })
        const seasonStats = await getSeasonStats(selectedSeason)
        setResults(seasonStats)
    }

    const handleCheckbox = async (event) => {
        const id = event.target.id
        const ascCheckbox = document.getElementById("asc")
        const descCheckbox = document.getElementById("desc")
        const gpCheckbox = document.getElementById("gp")
        const gpNumberCheckbox = document.getElementById("group_number")
        let order = ""
        let sort = ""
        let sort2 = ""
        
        if (ascCheckbox.checked && descCheckbox.checked) {
            order = id
        }

        else if (ascCheckbox.checked) {
            order = "asc"
        }

        else if (descCheckbox.checked) {
            order = "desc"
        }

        if (gpCheckbox.checked) {
            sort = "gp"
        }
        
        if (gpNumberCheckbox.checked) {
            sort = "group_number"
        }

        const seasonStats = await getSeasonStats(selectedSeason.season, order, sort, sort2)
        setResults(seasonStats)
    }

    return (
        <>
            <div id="select-container">
                <label>Select Season&nbsp;</label>
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
            <div id="checkbox-container">
                <label>Ascending</label><input id="asc" type="checkbox" onClick={handleCheckbox}></input>
                <label>Descending</label><input id="desc" type="checkbox" onClick={handleCheckbox}></input>
                <label>GP</label><input id="gp" type="checkbox" onClick={handleCheckbox}></input>
                <label>Group Number</label><input id="group_number" type="checkbox" onClick={handleCheckbox}></input>
            </div>
            <Table
                className={"table-wrapper"}
                headers={["Rank", "#", "GP", "Player", "Won", "Played", "%"]}
                rows={results}
            />
        </>
    )
}