"use client"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faUserPlus,
  faUsers,
  faChartSimple,
  faFlagCheckered,
  faCalendar,
  faWrench,
} from "@fortawesome/free-solid-svg-icons"
import { usePathname } from "next/navigation"

export default function Sidebar({ sessionType }): JSX.Element {
  const pathname = usePathname()
  return (
    <div className="absolute top-0 left-0 flex flex-col items-center bg-black text-white w-[50px] h-full">
      <Link
        href={"/teams"}
        className={
          pathname === "/teams"
            ? "relative group h-[50px] w-full !box-border cursor-pointer bg-gray-500 border-l-[3px] border-l-blue-300"
            : "relative group h-[50px] w-full !box-border hover:cursor-pointer hover:bg-gray-500 hover:border-l-[3px] hover:border-l-blue-300"
        }
      >
        <span className="relative inline-block invisible top-[5px] left-[55px] bg-black text-white pt-[10px] pr-0 pb-[10px] pl-[5px] w-[120px] text-left z-[1] group-hover:visible">
          Select Teams
        </span>
        <FontAwesomeIcon
          icon={faUserPlus}
          size="xl"
          className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white"
        />
      </Link>
      <Link
        href={"/weekly"}
        className={
          pathname === "/weekly"
            ? "relative group h-[50px] w-full !box-border cursor-pointer bg-gray-500 border-l-[3px] border-l-blue-300"
            : "relative group h-[50px] w-full !box-border hover:cursor-pointer hover:bg-gray-500 hover:border-l-[3px] hover:border-l-blue-300"
        }
      >
        <span className="relative inline-block invisible top-[5px] left-[55px] bg-black text-white pt-[10px] pr-0 pb-[10px] pl-[5px] w-[120px] text-left z-[1] group-hover:visible">
          Week Picks
        </span>
        <FontAwesomeIcon
          icon={faUsers}
          size="xl"
          className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white"
        />
      </Link>
      <Link
        href={"/season"}
        className={
          pathname === "/season"
            ? "relative group h-[50px] w-full !box-border cursor-pointer bg-gray-500 border-l-[3px] border-l-blue-300"
            : "relative group h-[50px] w-full !box-border hover:cursor-pointer hover:bg-gray-500 hover:border-l-[3px] hover:border-l-blue-300"
        }
      >
        <span className="relative inline-block invisible top-[5px] left-[55px] bg-black text-white pt-[10px] pr-0 pb-[10px] pl-[5px] w-[120px] text-left z-[1] group-hover:visible">
          Season Stats
        </span>
        <FontAwesomeIcon
          icon={faChartSimple}
          size="xl"
          className="text-white absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
        />
      </Link>
      <Link
        href={"/results"}
        id="results-link"
        className={
          pathname === "/results"
            ? "relative group h-[50px] w-full !box-border cursor-pointer bg-gray-500 border-l-[3px] border-l-blue-300"
            : "relative group h-[50px] w-full !box-border hover:cursor-pointer hover:bg-gray-500 hover:border-l-[3px] hover:border-l-blue-300"
        }
      >
        <span className="relative inline-block invisible top-[5px] left-[55px] bg-black text-white pt-[10px] pr-0 pb-[10px] pl-[5px] w-[120px] text-left z-[1] group-hover:visible">
          Winners & 0'fers
        </span>
        <FontAwesomeIcon
          icon={faFlagCheckered}
          size="xl"
          className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white"
        />
      </Link>
      <Link
        href={"/games"}
        className={
          pathname === "/games"
            ? "relative group h-[50px] w-full !box-border cursor-pointer bg-gray-500 border-l-[3px] border-l-blue-300"
            : "relative group h-[50px] w-full !box-border hover:cursor-pointer hover:bg-gray-500 hover:border-l-[3px] hover:border-l-blue-300"
        }
      >
        <span className="relative inline-block invisible top-[5px] left-[55px] bg-black text-white pt-[10px] pr-0 pb-[10px] pl-[5px] w-[120px] text-left z-[1] group-hover:visible">
          Week Games
        </span>
        <FontAwesomeIcon
          icon={faCalendar}
          size="xl"
          className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white"
        />
      </Link>
      {sessionType && sessionType === "admin" && (
        <Link
          href={"/admin_utility"}
          className={
            pathname === "/admin_utility"
              ? "relative group h-[50px] w-full !box-border cursor-pointer bg-gray-500 border-l-[3px] border-l-blue-300"
              : "relative group h-[50px] w-full !box-border hover:cursor-pointer hover:bg-gray-500 hover:border-l-[3px] hover:border-l-blue-300"
          }
        >
          <span className="relative inline-block invisible top-[5px] left-[55px] bg-black text-white pt-[10px] pr-0 pb-[10px] pl-[5px] w-[120px] text-left z-[1] group-hover:visible">
            Admin Utility
          </span>
          <FontAwesomeIcon
            icon={faWrench}
            size="xl"
            className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white"
          />
        </Link>
      )}
    </div>
  )
}
