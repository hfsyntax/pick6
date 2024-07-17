"use client"
import Image from "next/image"
import Link from "next/link"
import { Fragment, useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { FixedSizeList, VariableSizeList } from "react-window"
import type { QueryResultRow } from "@vercel/postgres"

export default function OptimizedTable({ headers, rows }: {headers: string[], rows: QueryResultRow[]}): JSX.Element {
    // calculation to render winners and losers
    const [rowData, setRowData] = useState({rowHeights: {0: 50}, totalPlayers: 0, additionalHeight: 0})
    const getItemSize = (index: number) => rowData.rowHeights[index]
    const headerSize = 50
    const playerCellSize = 30
    

    useEffect(() => {
        const newRowHeights = {0: 50}
        let totalPlayers = 0
        for (let [index, row] of rows.entries()) {
            if (row?.losers_count && row?.winners_count) {
                const losers = Number(row.losers_count)
                const winners = Number(row.winners_count)
                const maxPlayers = Math.max(losers, winners)
                const rowHeight = (maxPlayers * playerCellSize) + 1 // (just below bottom edge of previous row)
                newRowHeights[index + 1] = rowHeight
                totalPlayers += maxPlayers
            }
        }
        //list-item height is players.length * 30 px + reg height of 50
        const additionalHeight = totalPlayers * playerCellSize + headerSize
        setRowData({rowHeights: newRowHeights, totalPlayers: totalPlayers, additionalHeight: additionalHeight})
    }, [])

    const Row = ({ index, style }: {index: number, style: CSSProperties}): JSX.Element => {
        return (
            <div key={`row_${index}`} className={index === 0 ? 'list-item header' : 'list-item'} style={style}>
                {index === 0 ?
                    headers.map((header, headerIndex) => (
                        <li key={`header_${headerIndex}`} className={header === "0'fers" ? "loser" : null}>{header}</li> 
                        
                    )) :
                    Object.keys(rows[index - 1])
                        .filter(field => !["player_id", "game_id", "favorite_id", "underdog_id", "picture_url", "losers_count", "winners_count"].includes(field))
                        .map(field => (
                            // for list containing multiple winners and losers
                            String(rows[index - 1][field]).includes("<br>") ?
                                <li key={`result_players_${field}_${index - 1}`}>
                                    <div className={field === "loser_names" ? "loser" : "winner"}>
                                        {rows[index - 1][field].split("<br>")
                                            .map((text, i) => (
                                                <span key={`result_player_${i}`}>
                                                    <Image width={"25"} height={"25"} src={text.split(" ")[0] ? text.split(" ")[0] : "/img/default.png"} alt="profile_picture" />
                                                    <Link href={`/profile/${text.split(" ")[2]}`}>&nbsp;{text.split(" ")[1]}</Link>
                                                </span>
                                            ))
                                        }
                                    </div>
                                </li>
                                :
                                // for selecting teams each week
                                (field === "favorite_team" || field === "underdog_team" ?
                                    <Fragment key={`${field}_${index - 1}`}>
                                        <input type="checkbox" name={field === "favorite_team" ?
                                            rows[index - 1]["favorite_id"] :
                                            rows[index - 1]["underdog_id"]} value={rows[index - 1]["game_id"]}
                                        />
                                        <li>{rows[index - 1][field]}</li>
                                    </Fragment>
                                    :
                                    // single winner or loser
                                    (["winner_names", "loser_names"].includes(field) &&
                                        !["NONE!!!", "ROLL-OVER!!!"].includes(rows[index - 1][field]) ?
                                        <li key={`result_player_${index - 1}`} className={field === "loser_names" ? "loser" : null}>
                                            <Image width={25} height={25} src={rows[index - 1][field].split(" ")[0] ? rows[index - 1][field].split(" ")[0] : "/img/default.png"} alt="profile_picture" />
                                            <Link href={`/profile/${rows[index - 1][field].split(" ")[2]}`}>&nbsp;{rows[index - 1][field].split(" ")[1]}</Link>
                                        </li>
                                        :
                                        // link to player profile
                                        (field === "player_name" ?
                                            <Fragment key={`player_profile_${index}`}>
                                                <Image className="list-item-player" width={50} height={50} src={rows[index - 1]["picture_url"] ? rows[index - 1]["picture_url"] : "/img/default.png"} alt="profile_picture" />
                                                <li className="list-item-player"><Link href={`/profile/${rows[index - 1]["player_id"]}`}>{rows[index - 1][field]}<br /></Link></li>
                                            </Fragment>
                                            :
                                            <li key={`${field}_${index - 1}`} className={field === "loser_names" ? "loser" : null}>{rows[index - 1][field]}</li>)))
                        ))
                }

            </div>
        )
    }


    return (
        rowData.totalPlayers > 0 ? 
        <VariableSizeList
            className={"list"}
            height={rowData.additionalHeight}
            itemCount={rows?.length + 1}
            itemSize={getItemSize}
            width={"100%"}>
            {Row}
        </VariableSizeList> :
        <FixedSizeList
            className={"list"}
            height={500}
            itemCount={rows?.length + 1}
            itemSize={50}
            width={"100%"}>
            {Row}
        </FixedSizeList>
    )
}