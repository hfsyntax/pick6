"use client"
import type { columnSettings } from "../types"
import type { CSSProperties } from "react"
import type { Size } from "react-virtualized-auto-sizer"
import { useState, useRef, useEffect } from "react"
import { VariableSizeList } from "react-window"
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
      className="flex items-center"
      style={{
        ...style,
      }}
    >
      {index !== 0 && (
        <div className="absolute bottom-0 h-[1px] w-[93%] bg-black md:w-[97%]"></div>
      )}
      {Object.keys(row)
        .filter((field) => !nonDisplayedCols.includes(field))
        .map((field: string, rowIndex: number) => (
          <div
            id={`${field}_${index}`}
            key={`${field}_${index}`}
            style={{
              width:
                windowWidth < 768
                  ? columnWidths[field].small
                  : windowWidth < 1200
                    ? columnWidths[field].medium
                    : columnWidths[field].large,
            }}
            className={`relative flex flex-col gap-[5px] ${
              index === 0 ? "bg-black text-white" : "bg-white text-black"
            } flex-shrink-0 leading-[35px]`}
          >
            {index === 0
              ? columns[rowIndex]
              : ["winner_names", "loser_names"].includes(field) &&
                  !["NONE!!!", "ROLL-OVER!!!"].includes(row[field])
                ? row[field]
                    .split("<br>")
                    .map((entry: string, index: number) => {
                      return (
                        <div
                          className={`flex items-center`}
                          key={`group_${index}_${entry.split(" ")[2]}`}
                        >
                          <Link
                            href={`/profile/${entry.split(" ")[2]}`}
                            className="peer"
                          >
                            <Image
                              width={0}
                              height={0}
                              src={
                                entry.split(" ")[0]
                                  ? entry.split(" ")[0]
                                  : "/default.png"
                              }
                              alt="profile_pic"
                              className="h-[25px] w-auto lg:h-[35px]"
                            />
                          </Link>
                          <Link
                            href={`/profile/${entry.split(" ")[2]}`}
                            className="hover:bg-black hover:text-white peer-hover:bg-black peer-hover:text-white"
                          >
                            <span className="ml-1">{entry.split(" ")[1]}</span>
                          </Link>
                        </div>
                      )
                    })
                : row[field]}
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
    <div className="mt-3 w-full overflow-auto" style={{ height: height }}>
      <div
        className={`ml-auto mr-auto h-full text-[10px] md:text-[14px] lg:text-[14px]`}
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
