"use client"
import { useState, useEffect, useRef } from "react"
import { getSeasonStats } from "../actions/serverRequests"
import Table from './Table'

export default function SeasonsHandler({ currentSeason, currentSeasonID, allSeasons, stats }) {
    const [selectedSeason, setSelectedSeason] = useState({ season: currentSeason, id: currentSeasonID })
    const [results, setResults] = useState(stats)
    const [sorts, setSorts] = useState({order: null, sort: null, sort2: null})
    const ascCheckbox = useRef()
    const descCheckbox = useRef()
    const groupCheckbox = useRef()
    const groupNumberCheckbox = useRef()
    const sortStateRan = useRef(false)

    const handleSelection = async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex]
        const selectedSeasonID = selectedOption.value
        const selectedSeason = selectedOption.getAttribute("data-season")
        setSelectedSeason({ season: selectedSeason, id: selectedSeasonID })
        const seasonStats = await getSeasonStats(selectedSeason)
        setResults(seasonStats)
    }

    const handleCheckbox = async (event) => {
        const {id, checked} = event.target
        
        // ascending or descending order
        if (id === ascCheckbox.current.id || id === descCheckbox.current.id) {
            // already checked overwrite
            if (checked) {
                setSorts({...sorts, order: id})
            } else {
                if (id === ascCheckbox.current.id) {
                    setSorts({...sorts, order: descCheckbox.current.checked ? descCheckbox.current.id : null})
                } else {
                    setSorts({...sorts, order: ascCheckbox.current.checked ? ascCheckbox.current.id : null})
                }
            }
        } 

        // extra sorts
        if (id === groupCheckbox.current.id) {
            if (groupCheckbox.current.checked) {
                setSorts({...sorts, sort: groupCheckbox.current.id, sort2: groupNumberCheckbox.current.checked ? groupNumberCheckbox.current.id : null})
            } else {
                setSorts({...sorts, sort: groupNumberCheckbox.current.checked ? groupNumberCheckbox.current.id : null, sort2: null})  
            }
        } else if (id === groupNumberCheckbox.current.id) {
            if (groupNumberCheckbox.current.checked) {
                if (groupCheckbox.current.checked) {
                    setSorts({...sorts, sort: groupCheckbox.current.id, sort2: groupNumberCheckbox.current.id})
                } else {
                    setSorts({...sorts, sort: groupNumberCheckbox.current.id, sort2: null})
                }
            } else {
                setSorts({...sorts, sort: groupCheckbox.current.checked ? groupCheckbox.current.id : null, sort2: null})
            }
        }
    }

    useEffect(() => {
        if (!sortStateRan.current) {
            sortStateRan.current = true
        } else {
            getSeasonStats(selectedSeason.season, sorts.order, sorts.sort, sorts.sort2)
            .then(response => {
                setResults(response)
            })
        }
    }, [sorts])

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
                <label>Ascending</label><input ref={ascCheckbox} id="asc" type="checkbox" onClick={handleCheckbox}></input>
                <label>Descending</label><input ref={descCheckbox} id="desc" type="checkbox" onClick={handleCheckbox}></input>
                <label>GP</label><input ref={groupCheckbox} id="gp" type="checkbox" onClick={handleCheckbox}></input>
                <label>Group Number</label><input ref={groupNumberCheckbox} id="group_number" type="checkbox" onClick={handleCheckbox}></input>
            </div>
            <Table
                className={"table-wrapper"}
                headers={["Rank", "#", "GP", "Player", "Won", "Played", "%"]}
                rows={results}
            />
        </>
    )
}