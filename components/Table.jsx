import Image from "next/image"
import Link from "next/link"

export default function Table({ className, id, headers, rows }) {
    return (
        <div className={className} id={id}>
            {rows.length > 0 ?
                <table>
                    <thead>
                        <tr key={"rowHeaders"}>
                            {headers.map((header, index) => (
                                <th key={index}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                {Object.keys(row)
                                    // do not display player_id but use it as a reference for profile link
                                    // do not display favorite_id or underdog_id but use as reference
                                    .filter(field => !["player_id", "game_id", "favorite_id", "underdog_id", "picture_url"].includes(field))
                                    .map(field => (
                                        <td key={field}>
                                            { // for lists containing multiple winners & losers for week
                                                String(row[field]).includes("<br>") ?
                                                    row[field].split("<br>").map((text, index) => (
                                                        <li key={index}>
                                                        <Image width={"25"} height={"25"} src={text.split(" ")[0] ? text.split(" ")[0] : "/profile_pictures/default.png"} alt="profile_picture"/>
                                                        <Link key={index} href={`/profile/${text.split(" ")[2]}`}>&nbsp;{text.split(" ")[1]}<br /></Link>
                                                        </li>
                                                    ))
                                                    : ( // for selecting teams each week
                                                        field === "favorite_team" || field === "underdog_team") ?
                                                        <>
                                                            <input type="checkbox" name={field === "favorite_team" ? row["favorite_id"] : row["underdog_id"]} value={row["game_id"]} />
                                                            {row[field]}
                                                        </>
                                                        : ( // single winner or loser
                                                            ["winner_names", "loser_names"].includes(field) && !["NONE!!!", "ROLL-OVER!!!"].includes(row[field]) ?
                                                                <>
                                                                <Image width={"25"} height={"25"} src={row[field].split(" ")[0] ? row[field].split(" ")[0] : "/profile_pictures/default.png"} alt="profile_picture"/>
                                                                <Link key={index} href={`/profile/${row[field].split(" ")[2]}`}>&nbsp;{row[field].split(" ")[1]}<br /></Link>
                                                                </>
                                                                : (field === "player_name" ?
                                                                    <>
                                                                    <Image width={"25"} height={"25"} src={row["picture_url"] ? row["picture_url"] : "/profile_pictures/default.png"} alt="profile_picture"/>
                                                                    <Link key={index} href={`/profile/${row["player_id"]}`}>&nbsp;{row[field]}<br /></Link>
                                                                    </>
                                                                    : row[field]))
                                            }
                                        </td>
                                    ))}
                            </tr>
                        ))}
                    </tbody>
                </table> : <h3 style={{color: "red", textAlign: "center"}}>No data</h3>}

        </div>

    )
}