"use client"
import Image from "next/image"
import Link from "next/link"
import { Fragment } from "react"

import { FixedSizeList } from "react-window"

export default function OptimizedTable({ className, headers, rows }) {
    const Row = ({ index, style }) => (
        <div key={`row_${index}`} className={index === 0 ? 'list-item header' : 'list-item'} style={style}>
            {index === 0 ?
                headers.map((header, headerIndex) => (
                    <li key={`header_${headerIndex}`}>{header}</li>
                )) :
                Object.keys(rows[index])
                    .filter(field => !["player_id", "game_id", "favorite_id", "underdog_id", "picture_url"].includes(field))
                    .map(field => (
                        // for list containing multiple winners and losers
                        String(rows[index - 1][field]).includes("<br>") ?
                            rows[index - 1][field].split("<br>")
                                .map((text, index) => (
                                    <li key={`result_player_multiple_${index}`}>
                                        <Image width={"50"} height={"50"} src={text.split(" ")[0] ? text.split(" ")[0] : "/img/default.png"} alt="profile_picture" />
                                        <Link href={`/profile/${text.split(" ")[2]}`}>{text.split(" ")[1]}<br /></Link>
                                    </li>
                                ))
                            :
                            // for selecting teams each week
                            (field === "favorite_team" || field === "underdog_team" ?
                                <>
                                    <input type="checkbox" name={field === "favorite_team" ?
                                        rows[index - 1]["favorite_id"] : rows[index - 1]["underdog_id"]} value={rows[index - 1]["game_id"]} />
                                    {rows[index - 1][field]}
                                </>
                                :
                                // single winner or loser
                                (["winner_names", "loser_names"].includes(field) &&
                                    !["NONE!!!", "ROLL-OVER!!!"].includes(rows[index - 1][field]) ?
                                    <li key={`result_player_single_${index}`}>
                                        <Image width={50} height={50} src={rows[index - 1][field].split(" ")[0] ? rows[index - 1][field].split(" ")[0] : "/img/default.png"} alt="profile_picture" />
                                        <Link href={`/profile/${rows[index - 1][field].split(" ")[2]}`}>{rows[index - 1][field].split(" ")[1]}<br /></Link>
                                    </li>
                                    :
                                    // link to player profile
                                    (field === "player_name" ?
                                        <Fragment key={`player_profile_${index}`}>
                                            <Image className="list-item-player"  width={50} height={50} src={rows[index - 1]["picture_url"] ? rows[index - 1]["picture_url"] : "/img/default.png"} alt="profile_picture" />
                                            <li className="list-item-player"><Link href={`/profile/${rows[index - 1]["player_id"]}`}>{rows[index - 1][field]}<br /></Link></li>
                                        </Fragment>
                                        :
                                        <li key={`${field}_${index}`}>{rows[index - 1][field]}</li>)))
                    ))
            }

        </div>
    )

    return (
        <FixedSizeList
            className="list"
            height={500}
            itemCount={rows?.length + 1}
            itemSize={50}
            width={"100%"}>
            {Row}
        </FixedSizeList>
    )
}