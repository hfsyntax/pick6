"use client"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUserPlus, faUsers, faChartSimple, faFlagCheckered, faCalendar, faWrench } from "@fortawesome/free-solid-svg-icons"
import { usePathname } from "next/navigation"

export default function Sidebar({sessionType}): JSX.Element {
    const pathname = usePathname()
    return (
        <div className="sidebar">
            <Link href={"/teams"} className={pathname === "/teams" ? "side-item active" : "side-item"}>
                <span className="tooltip">Select Teams</span>
                <FontAwesomeIcon icon={faUserPlus} size="xl" />
            </Link>
            <Link href={"/weekly"} className={pathname === "/weekly" ? "side-item active" : "side-item"}>
                <span className="tooltip">Week Picks</span>
                    <FontAwesomeIcon icon={faUsers} size="xl" />
            </Link>
            <Link href={"/season"} className={pathname === "/season" ? "side-item active" : "side-item"}>
                <span className="tooltip">Season Stats</span>
                    <FontAwesomeIcon icon={faChartSimple} size="xl" />
            </Link>
            <Link href={"/results"} className={pathname === "/results" ? "side-item active" : "side-item"}>
                <span className="tooltip">0'fers & Winners</span>
                    <FontAwesomeIcon icon={faFlagCheckered} size="xl" />
            </Link>
            <Link href={"/games"} className={pathname === "/games" ? "side-item active" : "side-item"}>
                <span className="tooltip">Week Games</span>
                    <FontAwesomeIcon icon={faCalendar} size="xl" />
            </Link>
            {sessionType && sessionType === "admin" &&
                <Link href={"/admin_utility"} className={pathname === "/admin_utility" ? "side-item active" : "side-item"}>
                    <span className="tooltip">Admin Utility</span>
                        <FontAwesomeIcon icon={faWrench} size="xl" />
                </Link>}
        </div>
    )
}