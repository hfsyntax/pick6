"use client"
import type { columnSettings } from "../types"
import type { QueryResultRow } from "@vercel/postgres"
import type { ChangeEvent, MouseEvent } from "react"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  getPicks,
  getSeasonStats,
  getWeekGameResults,
  getWeekResults,
} from "../actions/serverRequests"
import FixedTable from "./FixedTable"
import DynamicTable from "./DynamicTable"

interface ComponentProps {
  currentSeason: QueryResultRow[string]
  currentWeek: QueryResultRow[string] | undefined
  selectedId: QueryResultRow[string]
  selectOptions: QueryResultRow[]
  initialData: any[]
  headers: string[]
  columnWidths: columnSettings
  rowHeights?: number[]
}

export default function SeasonWeeksHandler({
  currentSeason,
  currentWeek,
  selectedId,
  selectOptions,
  initialData,
  headers,
  columnWidths,
  rowHeights,
}: ComponentProps): JSX.Element {
  const [selectedOption, setSelectedOption] = useState({
    season: currentSeason,
    week: currentWeek,
    id: selectedId,
  })

  const [data, setData] = useState({
    currentData: initialData,
    dataHeaders: headers,
  })

  // updated rowheights for dynamic table (specific to week/season)
  const [currentRowHeights, setCurrentRowHeights] =
    useState<number[]>(rowHeights)

  const [sorts, setSorts] = useState({
    order: "asc",
    rank: true,
    gp: false,
    group_number: false,
  })
  const sortStateRan = useRef(false)
  const pathname = usePathname()

  const handleSelection = async (event: ChangeEvent<HTMLSelectElement>) => {
    const currentOption = event.target.options[event.target.selectedIndex]
    const selectedOptionId = currentOption.value
    const selectedSeason = currentOption.getAttribute("data-season")
    const selectedWeek = currentOption.getAttribute("data-week")

    // do not update state if the same option is selected
    if (pathname === "/weekly" || pathname === "/games") {
      if (
        selectedOption.season == selectedSeason &&
        selectedOption.week == selectedWeek
      )
        return
    }

    if (pathname === "/season" || pathname === "/results") {
      if (selectedOption.season == selectedSeason) return
    }

    setSelectedOption({
      season: selectedSeason,
      week: selectedWeek,
      id: selectedOptionId,
    })

    if (pathname === "/weekly") {
      const picks = await getPicks(selectedSeason, selectedWeek, "asc", [
        "rank",
      ])
      setData({ currentData: picks.picks, dataHeaders: picks.headers })
    } else if (pathname === "/season") {
      const seasonStats = await getSeasonStats(selectedSeason, "asc", ["rank"])
      setData((prevState) => ({
        ...prevState,
        currentData: seasonStats,
      }))
    } else if (pathname === "/games") {
      const weekGames = await getWeekGameResults(selectedSeason, selectedWeek)
      setData((prevState) => ({
        ...prevState,
        currentData: weekGames,
      }))
    } else {
      const weekResults = await getWeekResults(
        selectedSeason,
        currentSeason,
        currentWeek,
      )
      setData((prevState) => ({
        ...prevState,
        currentData: weekResults,
      }))
      const rowHeights = [
        35,
        ...weekResults.map((week) => {
          const maxPlayers = Math.max(
            week["winners_count"],
            week["losers_count"],
            1,
          )
          // 35px row height + gap of 10px between each row
          return maxPlayers * 35 + (maxPlayers - 1) * 10
        }),
      ]
      setCurrentRowHeights(rowHeights)
    }
  }

  const handleCheckbox = async (event: MouseEvent<HTMLInputElement>) => {
    const { id, checked } = event.currentTarget
    if (id === "desc") {
      setSorts((prevState) => ({
        ...prevState,
        order: checked ? "desc" : "asc",
      }))
    } else {
      setSorts((prevState) => ({
        ...prevState,
        [id]: checked ? true : false,
      }))
    }
  }

  useEffect(() => {
    if (!sortStateRan.current) {
      sortStateRan.current = true
    } else {
      if (pathname === "/weekly") {
        getPicks(
          selectedOption.season,
          selectedOption.week,
          sorts.order,
          [
            sorts.rank && "rank",
            sorts.gp && "gp",
            sorts.group_number && "group_number",
          ].filter((x) => x),
        ).then((response) => {
          setData({
            currentData: response.picks,
            dataHeaders: response.headers,
          })
        })
      } else if (pathname === "/season") {
        getSeasonStats(
          selectedOption.season,
          sorts.order,
          [
            sorts.rank && "rank",
            sorts.gp && "gp",
            sorts.group_number && "group_number",
          ].filter((x) => x),
        ).then((response) => {
          setData((prevState) => ({
            ...prevState,
            currentData: response,
          }))
        })
      }
    }
  }, [sorts])

  return (
    <>
      <>
        <div className="flex items-center">
          <label className="text-sm font-bold sm:text-base lg:text-xl">
            {pathname === "/weekly" ? "Select Week" : "Select Season"}&nbsp;
          </label>
          <select
            className="m-[10px] h-[25px] w-[155px] border border-black text-center text-xs focus:outline-none lg:w-[200px] lg:text-base"
            onChange={handleSelection}
            defaultValue={selectedOption.id}
          >
            {selectOptions.map((row) =>
              pathname === "/weekly" || pathname === "/games" ? (
                <option
                  key={row["week_id"]}
                  value={row["week_id"]}
                  data-season={row["season_number"]}
                  data-week={row["week_number"]}
                >
                  Week {row["week_number"]} of Season {row["season_number"]}
                </option>
              ) : (
                <option
                  key={row["season_id"]}
                  value={row["season_id"]}
                  data-season={row["season_number"]}
                >
                  Season {row["season_number"]}
                </option>
              ),
            )}
          </select>
        </div>
        {data?.currentData?.length > 0 &&
          (pathname === "/weekly" || pathname === "/season") && (
            <div id="checkbox-container" className="text-center">
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                Descending
              </label>
              <input
                className="mr-[10px] align-middle"
                id="desc"
                type="checkbox"
                onClick={handleCheckbox}
              ></input>
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                Rank
              </label>
              <input
                className="mr-[10px] align-middle"
                id="rank"
                type="checkbox"
                onClick={handleCheckbox}
                defaultChecked
              ></input>
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                GP
              </label>
              <input
                className="mr-[10px] align-middle"
                id="gp"
                type="checkbox"
                onClick={handleCheckbox}
              ></input>
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                Group Number
              </label>
              <input
                className="mr-[10px] align-middle"
                id="group_number"
                type="checkbox"
                onClick={handleCheckbox}
              ></input>
            </div>
          )}
      </>
      {data?.currentData?.length > 0 ? (
        pathname !== "/results" ? (
          <FixedTable
            data={[{ ...data.currentData[0] }, ...data.currentData]}
            columns={data.dataHeaders}
            columnWidths={columnWidths}
            height={`min(${50 + 50 * data.currentData.length}px, 65vh)`}
          />
        ) : (
          <DynamicTable
            data={[{ ...data.currentData[0] }, ...data.currentData]}
            columns={data.dataHeaders}
            columnWidths={columnWidths}
            rowHeights={currentRowHeights}
            height={`min(${currentRowHeights.reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0,
            )}px, 65vh)`}
          />
        )
      ) : (
        <h3 className="mt-3 text-center text-red-500">No data</h3>
      )}
    </>
  )
}
