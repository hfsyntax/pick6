"use client"
import type { columnSettings, SortFields } from "../types"
import type { QueryResultRow } from "@vercel/postgres"
import type { ChangeEvent, MouseEvent } from "react"
import { useState, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import FixedTable from "./FixedTable"
import DynamicTable from "./DynamicTable"

interface ComponentProps {
  currentSeason: number
  currentWeek: number | undefined
  sort?: "asc" | "desc"
  sortFields?: Array<SortFields>
  selectedId: QueryResultRow[string]
  selectOptions: QueryResultRow[]
  data: any[]
  originalDataExists: boolean
  headers: string[]
  columnWidths: columnSettings
  rowHeights?: number[]
}

export default function SeasonWeeksHandler({
  currentSeason,
  currentWeek,
  sort,
  sortFields,
  selectedId,
  selectOptions,
  data,
  originalDataExists,
  headers,
  columnWidths,
  rowHeights,
}: ComponentProps) {
  const [selectedOption, setSelectedOption] = useState({
    season: currentSeason,
    week: currentWeek,
    id: selectedId,
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const rowHeight = 50
  const searchBarHeight = 25

  const createQueryString = useCallback(
    (names: string[], values: string[], newQuery: boolean = true) => {
      const params = new URLSearchParams(
        newQuery ? undefined : searchParams.toString(),
      )
      for (let i = 0; i < names.length; i++) {
        params.set(names[i], values[i])
      }
      return params.toString()
    },
    [searchParams],
  )

  const handleSelection = async (event: ChangeEvent<HTMLSelectElement>) => {
    const currentOption = event.target.options[event.target.selectedIndex]
    const selectedOptionId = currentOption.value
    const selectedSeason = Number(currentOption.getAttribute("data-season"))
    const selectedWeek = Number(currentOption.getAttribute("data-week"))

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
      router.push(
        pathname +
          "?" +
          createQueryString(
            ["season", "week", "sort", "fields"],
            [String(selectedSeason), String(selectedWeek), "asc", "rank"],
            false,
          ),
      )
    } else if (pathname === "/season") {
      router.push(
        pathname +
          "?" +
          createQueryString(
            ["season", "sort", "fields"],
            [String(selectedSeason), "asc", "rank"],
            false,
          ),
      )
    } else if (pathname === "/games") {
      router.push(
        pathname +
          "?" +
          createQueryString(
            ["season", "week"],
            [String(selectedSeason), String(selectedWeek)],
          ),
      )
    } else {
      router.push(
        pathname +
          "?" +
          createQueryString(["season"], [String(selectedSeason)]),
      )
    }
  }

  const handleCheckbox = async (event: MouseEvent<HTMLInputElement>) => {
    const { id, checked } = event.currentTarget
    if (id === "desc") {
      router.push(
        pathname +
          "?" +
          createQueryString(["sort"], [checked ? "desc" : "asc"], false),
      )
    } else {
      let fields = searchParams.get("fields")
      if (checked) {
        if (fields) {
          fields = fields
            .replace("none", "")
            .split(",")
            .filter((field) => field)
            .join(",")
          router.push(
            pathname +
              "?" +
              createQueryString(
                ["fields"],
                [fields ? `${fields},${id}` : id],
                false,
              ),
          )
        } else {
          router.push(
            pathname + "?" + createQueryString(["fields"], [id], false),
          )
        }
      } else {
        if (fields) {
          fields = fields
            .split(",")
            .filter((field) => field !== id)
            .join(",")
          if (!fields) {
            router.push(
              pathname + "?" + createQueryString(["fields"], ["none"], false),
            )
          } else {
            router.push(
              pathname + "?" + createQueryString(["fields"], [fields], false),
            )
          }
        } else {
          router.push(
            pathname + "?" + createQueryString(["fields"], ["none"], false),
          )
        }
      }
    }
  }

  return (
    <>
      <>
        <div className="flex items-center">
          <label className="text-sm font-bold sm:text-base lg:text-xl">
            {pathname === "/weekly" ? "Select Week" : "Select Season"}&nbsp;
          </label>
          <select
            className="m-[10px] h-[25px] w-[160px] border border-black text-center text-xs focus:outline-none lg:w-[210px] lg:text-base"
            onChange={handleSelection}
            defaultValue={selectedOption.id}
          >
            {selectOptions.map((row) =>
              pathname === "/weekly" || pathname === "/games" ? (
                <option
                  key={`week_option_${row["week_id"]}`}
                  value={row["week_id"]}
                  data-season={row["season_number"]}
                  data-week={row["week_number"]}
                >
                  Week {row["week_number"]} of Season {row["season_number"]}
                </option>
              ) : (
                <option
                  key={`season_option_${row["season_id"]}`}
                  value={row["season_id"]}
                  data-season={row["season_number"]}
                >
                  Season {row["season_number"]}
                </option>
              ),
            )}
          </select>
        </div>
        {data.length > 0 &&
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
                defaultChecked={sort === "desc"}
              ></input>
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                Rank
              </label>
              <input
                className="mr-[10px] align-middle"
                id="rank"
                type="checkbox"
                onClick={handleCheckbox}
                defaultChecked={sortFields.includes("rank")}
              ></input>
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                GP
              </label>
              <input
                className="mr-[10px] align-middle"
                id="gp"
                type="checkbox"
                onClick={handleCheckbox}
                defaultChecked={sortFields.includes("gp")}
              ></input>
              <label className="mr-1 align-middle text-xs font-bold sm:text-sm md:text-base xl:text-lg">
                Group Number
              </label>
              <input
                className="mr-[10px] align-middle"
                id="group_number"
                type="checkbox"
                onClick={handleCheckbox}
                defaultChecked={sortFields.includes("group_number")}
              ></input>
            </div>
          )}
      </>

      {originalDataExists ? (
        pathname !== "/results" ? (
          <FixedTable
            data={[{ ...data[0] }, ...data]}
            columns={headers}
            columnWidths={columnWidths}
            height={
              pathname === "/weekly" || pathname === "/season"
                ? `min(${searchBarHeight + rowHeight + rowHeight * data.length}px, 65vh)`
                : `min(${rowHeight + rowHeight * data.length}px, 65vh)`
            }
          />
        ) : (
          <DynamicTable
            //key={Date.now()}
            data={[{ ...data[0] }, ...data]}
            columns={headers}
            columnWidths={columnWidths}
            rowHeights={rowHeights}
            height={`min(${rowHeights.reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0,
            )}px, 65vh)`}
          />
        )
      ) : (
        <span className="text-red-500">no data</span>
      )}
    </>
  )
}
