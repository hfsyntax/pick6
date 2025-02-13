"use client"
import type { columnSettings } from "../types"
import type { CSSProperties } from "react"
import type { Size } from "react-virtualized-auto-sizer"
import { Fragment, useState, useRef, useEffect } from "react"
import { VariableSizeList } from "react-window"
import { usePathname } from "next/navigation"
import AutoSizer from "react-virtualized-auto-sizer"
import Image from "next/image"

const nonDisplayedCols = [
  "player_id",
  "picture_url",
  "favorite_id",
  "underdog_id",
  "game_id",
  "winners_count",
  "losers_count",
]

function Row({
  index,
  style,
  windowWidth,
  columns,
  columnWidths,
  data,
}: {
  index: number
  style: CSSProperties
  windowWidth: number
  columns: {}
  columnWidths: columnSettings
  data: any
}) {
  const row = data[index]

  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
      }}
    >
      {index !== 0 && (
        <div className="bottom-0 absolute h-[1px] w-[93%] md:w-[97%] bg-black"></div>
      )}
      {Object.keys(row)
        .filter((field) => !nonDisplayedCols.includes(field))
        .map((field: string, rowIndex: number) => (
          <div
            id={`${field}_${index}`}
            key={`${field}_${index}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              width:
                windowWidth < 768
                  ? columnWidths[field].small
                  : windowWidth < 1200
                  ? columnWidths[field].medium
                  : columnWidths[field].large,
            }}
            className={`inline-block relative ${
              index === 0 ? "text-white bg-black mb-2" : "text-black bg-white"
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
                  value={row["game_id"]}
                  className="inline-block absolute left-0 translate-y-[-50%] top-1/2"
                />
                <li className="inline-block">{row[field]}</li>
              </Fragment>
            ) : field === "loser_names" || field === "winner_names" ? (
              row[field].split("<br>").map((entry: string, index: number) => {
                return (
                  <div
                    className={`flex items-center`}
                    key={entry.split(" ")[2]}
                  >
                    <Image
                      width={0}
                      height={0}
                      src={
                        entry.split(" ")[0]
                          ? entry.split(" ")[0]
                          : "/img/default.png"
                      }
                      alt="profile_pic"
                      className="h-[25px] lg:h-[35px] w-auto"
                    />
                    <span className="ml-1">{entry.split(" ")[1]}</span>
                  </div>
                )
              })
            ) : (
              row[field]
            )}
          </div>
        ))}
    </div>
  )
}

export default function DynamicTable({
  data,
  columns,
  columnWidths,
  rowHeights,
  height,
}: {
  data: any
  columns: string[]
  columnWidths: columnSettings
  rowHeights: number[]
  height: string
}) {
  const getItemSize = (index: number) => rowHeights[index]
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
        style={{
          width: `${totalFixedWidth + 18}px`,
        }}
      >
        <AutoSizer>
          {({ height, width }: Size) => (
            <VariableSizeList
              height={height}
              itemCount={data.length}
              itemSize={getItemSize}
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
                />
              )}
            </VariableSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  )
}
