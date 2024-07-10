"use client"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { getPicks, getSeasonStats, getWeekGameResults, getWeekResults } from "../actions/serverRequests"
import OptimizedTable from "./OptimizedTable"

export default function SeasonWeeksHandler({ currentSeason, currentWeek, selectedId, selectOptions, initialData, headers }) {
    const [selectedOption, setSelectedOption] = useState({ season: currentSeason, week: currentWeek, id: selectedId })
    const [data, setData] = useState({ currentData: initialData, dataHeaders: headers })
    const [sorts, setSorts] = useState({ "order": "asc", "rank": true, "gp": false, "group_number": false })
    const sortStateRan = useRef(false)
    const pathname = usePathname()

    const handleSelection = async (event) => {
        const currentOption = event.target.options[event.target.selectedIndex]
        const selectedOptionId = currentOption.value
        const selectedSeason = currentOption.getAttribute("data-season")
        const selectedWeek = currentOption.getAttribute("data-week")
        setSelectedOption({ season: selectedSeason, week: selectedWeek, id: selectedOptionId })
        if (pathname === "/weekly") {
            const picks = await getPicks(selectedSeason, selectedWeek, "asc", ["rank"])
            setData({ currentData: picks.picks, dataHeaders: picks.headers })
        } else if (pathname === "/season") {
            const seasonStats = await getSeasonStats(selectedSeason, "asc", ["rank"])
            setData({ ...data, currentData: seasonStats })
        } else if (pathname === "/games") {
            const weekGames = await getWeekGameResults(selectedSeason, selectedWeek)
            setData({ ...data, currentData: weekGames })
        } else {
            const weekResults = await getWeekResults(selectedSeason, currentWeek)
            setData({ ...data, currentData: weekResults })
        }
    }

    const handleCheckbox = async (event) => {
        const { id, checked } = event.target
        if (id === "desc") {
            setSorts({ ...sorts, "order": checked ? "desc" : "asc" })
        } else {
            setSorts({ ...sorts, [id]: checked ? true : false })
        }
    }

    useEffect(() => {
        if (!sortStateRan.current) {
            sortStateRan.current = true
        } else {
            if (pathname === "/weekly") {
                getPicks(selectedOption.season, selectedOption.week, sorts.order, [sorts.gp && "gp", sorts.group_number && "group_number"].filter(x => x))
                    .then(response => {
                        setData({ currentData: response.picks, dataHeaders: response.headers })
                    })
            } else if (pathname === "/season") {
                getSeasonStats(selectedOption.season, sorts.order, [sorts.rank && "rank", sorts.gp && "gp", sorts.group_number && "group_number"].filter(x => x))
                    .then(response => {
                        setData({ ...data, currentData: response })
                    })
            }
        }
    }, [sorts])

    return (
        <>
                <>
                    <div id="select-container">
                        <label>{pathname === "/weekly" ? "Select Week" : "Select Season"}&nbsp;</label>
                        <select onChange={handleSelection} defaultValue={selectedOption.id}>
                            {selectOptions.map((row) => (
                                pathname === "/weekly" || pathname === "/games" ?
                                    <option
                                        key={row["week_id"]}
                                        value={row["week_id"]}
                                        data-season={row["season_number"]}
                                        data-week={row["week_number"]}
                                    >
                                        Week {row["week_number"]} of Season {row["season_number"]}
                                    </option>
                                    :
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
                    {
                        (data?.currentData?.length > 0 && (pathname === "/weekly" || pathname === "/season")) && <div id="checkbox-container">
                            <label>Descending</label><input id="desc" type="checkbox" onClick={handleCheckbox}></input>
                            <label>Rank</label><input id="rank" type="checkbox" onClick={handleCheckbox} defaultChecked></input>
                            <label>GP</label><input id="gp" type="checkbox" onClick={handleCheckbox}></input>
                            <label>Group Number</label><input id="group_number" type="checkbox" onClick={handleCheckbox}></input>
                        </div>
                    }
                </>
            {data?.currentData?.length > 0 ?<OptimizedTable
            headers={data.dataHeaders}
            rows={data.currentData}
            /> : <h3 style={{color: "red", textAlign: "center"}}>No data</h3> }
        </>
    )
}