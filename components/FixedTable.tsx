"use client"
import type { columnSettings } from "../types"
import type { CSSProperties, ChangeEvent, FormEvent } from "react"
import type { Size } from "react-virtualized-auto-sizer"
import { useState, useEffect, useRef, Fragment } from "react"
import { FixedSizeList } from "react-window"
import { usePathname } from "next/navigation"
import AutoSizer from "react-virtualized-auto-sizer"
import Image from "next/image"

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
  onCheckboxChange: (teamId: string, checked: boolean) => void
  selectedCheckboxes: { [key: string]: boolean }
}) {
  const row = data[index]

  return (
    <div style={{ ...style, display: "flex", alignItems: "center" }}>
      {Object.keys(row)
        .filter((field) => !nonDisplayedCols.includes(field))
        .map((field: string, rowIndex: number) => (
          <span
            id={`${field}_${index}`}
            key={rowIndex}
            style={{
              width:
                windowWidth < 768
                  ? columnWidths[field].small
                  : windowWidth < 1200
                  ? columnWidths[field].medium
                  : columnWidths[field].large,
            }}
            className={`inline-block relative ${
              index === 0 ? "text-white bg-black" : "text-black bg-white"
            } leading-[35px] flex-shrink-0`}
          >
            {index === 0 ? (
              columns[rowIndex]
            ) : field === "player_name" ? (
              <span className="relative w-full h-full block">
                <span className="block w-fit ml-[30px] lg:ml-[40px]">
                  {row[field]}
                </span>
                <Image
                  width={0}
                  height={0}
                  src={
                    row["picture_url"] ? row["picture_url"] : "/img/default.png"
                  }
                  alt="profile_pic"
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-3/4 lg:h-full w-auto"
                />
              </span>
            ) : field === "favorite_team" || field === "underdog_team" ? (
              <Fragment key={`${field}_${index}`}>
                <input
                  type="checkbox"
                  name={
                    field === "favorite_team"
                      ? row["favorite_id"]
                      : row["underdog_id"]
                  }
                  checked={
                    field === "favorite_team"
                      ? selectedCheckboxes[row["favorite_id"]]
                      : selectedCheckboxes[row["underdog_id"]]
                  }
                  onChange={(event) =>
                    onCheckboxChange(
                      row[
                        field === "favorite_team"
                          ? "favorite_id"
                          : "underdog_id"
                      ],
                      event.target.checked
                    )
                  }
                  value={row["game_id"]}
                  className="inline-block absolute left-0 translate-y-[-50%] top-1/2"
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
  onCheckboxChange?: (teamId: string, checked: boolean) => void
  selectedCheckboxes?: { [key: string]: boolean }
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
    <div className="overflow-auto w-full" style={{ height: height }}>
      <div
        className={`h-full text-[10px] md:text-[14px] lg:text-[14px] ml-auto mr-auto`}
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
