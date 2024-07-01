"use client"
import { useState } from "react"
import { getPicks } from "../actions/serverRequests"
import Table from './Table'

export default function WeeksHandler({ currentSeason, currentWeek, currentWeekID, allWeeks, weekPicks, headers }) {
    const [selectedWeek, setSelectedWeek] = useState({ season: currentSeason, week: currentWeek, id: currentWeekID })
    const [picks, setPicks] = useState({ picks: weekPicks, headers: headers })

    const handleSelection = async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex]
        const selectedWeekID = selectedOption.value
        const selectedSeason = selectedOption.getAttribute("data-season")
        const selectedWeek = selectedOption.getAttribute("data-week")
        setSelectedWeek({ season: selectedSeason, week: selectedWeek, id: selectedWeekID })
        const picks = await getPicks(selectedSeason, selectedWeek)
        setPicks({ picks: picks.picks, headers: picks.headers })
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

        const picks = await getPicks(selectedWeek.season, selectedWeek.week, order, sort, sort2)
        setPicks({picks: picks.picks, headers: picks.headers})
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
            <div id="checkbox-container">
                <label>Ascending</label><input id="asc" type="checkbox" onClick={handleCheckbox}></input>
                <label>Descending</label><input id="desc" type="checkbox" onClick={handleCheckbox}></input>
                <label>GP</label><input id="gp" type="checkbox" onClick={handleCheckbox}></input>
                <label>Group Number</label><input id="group_number" type="checkbox" onClick={handleCheckbox}></input>
            </div>
            <Table
                className={"table-wrapper"}
                headers={picks.headers}
                rows={picks.picks} />
        </>
    )
}