"use client"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { getPicks, getSeasonStats, getWeekGameResults, getWeekResults } from "../actions/serverRequests"
import Table from './Table'

export default function SeasonWeeksHandler({ currentSeason, currentWeek, selectedId, selectOptions, initialData, headers }) {
    const [selectedOption, setSelectedOption] = useState({ season: currentSeason, week: currentWeek, id: selectedId })
    const [data, setData] = useState({ currentData: initialData, dataHeaders: headers })
    const [sorts, setSorts] = useState({ order: null, sort: null, sort2: null })
    const ascCheckbox = useRef()
    const descCheckbox = useRef()
    const groupCheckbox = useRef()
    const groupNumberCheckbox = useRef()
    const sortStateRan = useRef(false)
    const pathname = usePathname()

    const handleSelection = async (event) => {
        const currentOption = event.target.options[event.target.selectedIndex]
        const selectedOptionId = currentOption.value
        const selectedSeason = currentOption.getAttribute("data-season")
        const selectedWeek = currentOption.getAttribute("data-week")
        setSelectedOption({ season: selectedSeason, week: selectedWeek, id: selectedOptionId })
        if (pathname === "/weekly") {
            const picks = await getPicks(selectedSeason, selectedWeek)
            setData({ currentData: picks.picks, dataHeaders: picks.headers })
        } else if (pathname === "/season") {
            const seasonStats = await getSeasonStats(selectedSeason)
            setData({ ...data, currentData: seasonStats })
        } else if (pathname === "/games") {
            const weekGames = await getWeekGameResults(selectedSeason, selectedWeek)
            setData({...data, currentData: weekGames})
        } else {
            const weekResults = await getWeekResults(selectedSeason, currentWeek)
            setData({...data, currentData: weekResults})
        }
    }

    const handleCheckbox = async (event) => {
        const { id, checked } = event.target

        // ascending or descending order
        if (id === ascCheckbox.current.id || id === descCheckbox.current.id) {
            // already checked overwrite
            if (checked) {
                setSorts({ ...sorts, order: id })
            } else {
                if (id === ascCheckbox.current.id) {
                    setSorts({ ...sorts, order: descCheckbox.current.checked ? descCheckbox.current.id : null })
                } else {
                    setSorts({ ...sorts, order: ascCheckbox.current.checked ? ascCheckbox.current.id : null })
                }
            }
        }

        // extra sorts
        if (id === groupCheckbox.current.id) {
            if (groupCheckbox.current.checked) {
                setSorts({ ...sorts, sort: groupCheckbox.current.id, sort2: groupNumberCheckbox.current.checked ? groupNumberCheckbox.current.id : null })
            } else {
                setSorts({ ...sorts, sort: groupNumberCheckbox.current.checked ? groupNumberCheckbox.current.id : null, sort2: null })
            }
        } else if (id === groupNumberCheckbox.current.id) {
            if (groupNumberCheckbox.current.checked) {
                if (groupCheckbox.current.checked) {
                    setSorts({ ...sorts, sort: groupCheckbox.current.id, sort2: groupNumberCheckbox.current.id })
                } else {
                    setSorts({ ...sorts, sort: groupNumberCheckbox.current.id, sort2: null })
                }
            } else {
                setSorts({ ...sorts, sort: groupCheckbox.current.checked ? groupCheckbox.current.id : null, sort2: null })
            }
        }
    }

    useEffect(() => {
        if (!sortStateRan.current) {
            sortStateRan.current = true
        } else {
            if (pathname === "/weekly") {
                getPicks(selectedOption.season, selectedOption.week, sorts.order, sorts.sort, sorts.sort2)
                    .then(response => {
                        setData({ currentData: response.picks, dataHeaders: response.headers })
                    })
            } else if (pathname === "/season") {
                getSeasonStats(selectedOption.season, sorts.order, sorts.sort, sorts.sort2)
                    .then(response => {
                        setData({ ...data, currentData: response })
                    })
            }
        }
    }, [sorts])

    return (
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
                (pathname === "/weekly" || pathname === "/season") && <div id="checkbox-container">
                <label>Ascending</label><input ref={ascCheckbox} id="asc" type="checkbox" onClick={handleCheckbox}></input>
                <label>Descending</label><input ref={descCheckbox} id="desc" type="checkbox" onClick={handleCheckbox}></input>
                <label>GP</label><input ref={groupCheckbox} id="gp" type="checkbox" onClick={handleCheckbox}></input>
                <label>Group Number</label><input ref={groupNumberCheckbox} id="group_number" type="checkbox" onClick={handleCheckbox}></input>
            </div>
            }
            <Table
                className={"table-wrapper"}
                headers={data.dataHeaders}
                rows={data.currentData}
            />
        </>
    )
}