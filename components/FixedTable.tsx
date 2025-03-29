"use client"
import type { columnSettings } from "../types"
import type { CSSProperties, ChangeEvent, FormEvent } from "react"
import type { Size } from "react-virtualized-auto-sizer"
import { useState, useEffect, useRef, Fragment } from "react"
import { FixedSizeList } from "react-window"
import { usePathname } from "next/navigation"
import AutoSizer from "react-virtualized-auto-sizer"
import Image from "next/image"
import Link from "next/link"

const nonDisplayedCols = [
  "player_id",
  "picture_url",
  "favorite_id",
  "underdog_id",
  "game_id",
]

function Row({
  index,
  style,
  windowWidth,
  columns,
  columnWidths,
  data,
  onCheckboxChange,
  selectedCheckboxes,
}: {
  index: number
  style: CSSProperties
  windowWidth: number
  columns: {}
  columnWidths: columnSettings
  data: any
  onCheckboxChange: (teamId: string, gameId: string, checked: boolean) => void
  selectedCheckboxes: { [key: string]: string }
}) {
  const row = data[index]

  return (
    <div style={{ ...style }} className="flex items-center">
      {Object.keys(row)
        .filter((field) => !nonDisplayedCols.includes(field))
        .map((field: string, rowIndex: number) => (
          <span
            id={`${field}_${index}`}
            key={`table_row_${rowIndex}`}
            style={{
              width:
                windowWidth < 768
                  ? columnWidths[field].small
                  : windowWidth < 1200
                    ? columnWidths[field].medium
                    : columnWidths[field].large,
            }}
            className={`relative inline-block ${
              index === 0 ? "bg-black text-white" : "bg-white text-black"
            } flex-shrink-0 leading-[35px]`}
          >
            {index === 0 ? (
              columns[rowIndex]
            ) : field === "player_name" ? (
              <span className="relative block h-full w-full">
                <Link href={`/profile/${row["player_id"]}`} className="peer">
                  <Image
                    width={0}
                    height={0}
                    src={
                      row["picture_url"] ? row["picture_url"] : "/default.png"
                    }
                    alt="profile_pic"
                    className="absolute left-0 top-1/2 h-3/4 w-auto -translate-y-1/2 lg:h-full"
                  />
                </Link>
                <Link
                  href={`/profile/${row["player_id"]}`}
                  className="ml-[30px] block w-fit hover:bg-black hover:text-white peer-hover:bg-black peer-hover:text-white lg:ml-[40px]"
                >
                  <span>{row[field]}</span>
                </Link>
              </span>
            ) : field === "favorite_team" || field === "underdog_team" ? (
              <Fragment key={`checkbox_container_${field}_${index}`}>
                <input
                  type="checkbox"
                  name={
                    field === "favorite_team"
                      ? row["favorite_id"]
                      : row["underdog_id"]
                  }
                  checked={
                    field === "favorite_team"
                      ? selectedCheckboxes[row["favorite_id"]] !== undefined
                      : selectedCheckboxes[row["underdog_id"]] !== undefined
                  }
                  onChange={(event) =>
                    onCheckboxChange(
                      row[
                        field === "favorite_team"
                          ? "favorite_id"
                          : "underdog_id"
                      ],
                      row["game_id"],
                      event.target.checked,
                    )
                  }
                  value={row["game_id"]}
                  className="absolute left-0 top-1/2 inline-block translate-y-[-50%]"
                />
                <li className="inline-block">{row[field]}</li>
              </Fragment>
            ) : (
              row[field]
            )}
          </span>
        ))}
    </div>
  )
}

export default function FixedTable({
  data,
  columns,
  columnWidths,
  onCheckboxChange,
  selectedCheckboxes,
  height = "65vh",
}: {
  data: any
  columns: string[]
  columnWidths: columnSettings
  onCheckboxChange?: (teamId: string, gameId: string, checked: boolean) => void
  selectedCheckboxes?: { [key: string]: string }
  height?: string
}) {
  const pathname = usePathname()
  const [windowWidth, setWindowWidth] = useState(0)
  const debounceTimeout = useRef(null)

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    return function (...args: any[]) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      debounceTimeout.current = setTimeout(() => {
        func(...args)
      }, delay)
    }
  }

  const handleResize = debounce(() => {
    setWindowWidth(window.innerWidth)
  }, 200)

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [handleResize])

  useEffect(() => {
    setWindowWidth(window.innerWidth)
  }, [pathname])

  const totalFixedWidth = Object.values(columnWidths).reduce((acc, width) => {
    acc +=
      windowWidth < 768
        ? width.small
        : windowWidth < 1200
          ? width.medium
          : width.large
    return acc
  }, 0)

  return (
    <div className="w-full overflow-auto" style={{ height: height }}>
      <div
        className={`ml-auto mr-auto h-full text-[10px] md:text-[14px] lg:text-[14px]`}
        /* 20px scrollbar */
        style={{
          width: `${totalFixedWidth + 18 /*+ (windowWidth < 768 ? 5 : 20)*/}px`,
        }}
      >
        <AutoSizer>
          {({ height, width }: Size) => (
            <FixedSizeList
              height={height}
              itemCount={data.length}
              itemSize={50}
              width={width}
              className="ml-auto mr-auto"
            >
              {({ index, style }) => (
                <Row
                  index={index}
                  style={style}
                  windowWidth={windowWidth}
                  columns={columns}
                  columnWidths={columnWidths}
                  data={data}
                  selectedCheckboxes={selectedCheckboxes}
                  onCheckboxChange={onCheckboxChange}
                />
              )}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  )
}
