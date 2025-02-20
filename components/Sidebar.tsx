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

export default function Sidebar({ sessionType }) {
  const pathname = usePathname()
  return (
    <div className="absolute left-0 top-0 flex h-full w-[50px] flex-col items-center bg-black text-white">
      <Link
        href={"/teams"}
        className={
          pathname === "/teams"
            ? "group relative !box-border h-[50px] w-full cursor-pointer border-l-[3px] border-l-blue-300 bg-gray-500"
            : "group relative !box-border h-[50px] w-full hover:cursor-pointer hover:border-l-[3px] hover:border-l-blue-300 hover:bg-gray-500"
        }
      >
        <span className="invisible relative left-[55px] top-[5px] z-[1] inline-block w-[120px] bg-black pb-[10px] pl-[5px] pr-0 pt-[10px] text-left text-white group-hover:visible">
          Select Teams
        </span>
        <FontAwesomeIcon
          icon={faUserPlus}
          size="xl"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
        />
      </Link>
      <Link
        href={"/weekly"}
        className={
          pathname === "/weekly"
            ? "group relative !box-border h-[50px] w-full cursor-pointer border-l-[3px] border-l-blue-300 bg-gray-500"
            : "group relative !box-border h-[50px] w-full hover:cursor-pointer hover:border-l-[3px] hover:border-l-blue-300 hover:bg-gray-500"
        }
      >
        <span className="invisible relative left-[55px] top-[5px] z-[1] inline-block w-[120px] bg-black pb-[10px] pl-[5px] pr-0 pt-[10px] text-left text-white group-hover:visible">
          Week Picks
        </span>
        <FontAwesomeIcon
          icon={faUsers}
          size="xl"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
        />
      </Link>
      <Link
        href={"/season"}
        className={
          pathname === "/season"
            ? "group relative !box-border h-[50px] w-full cursor-pointer border-l-[3px] border-l-blue-300 bg-gray-500"
            : "group relative !box-border h-[50px] w-full hover:cursor-pointer hover:border-l-[3px] hover:border-l-blue-300 hover:bg-gray-500"
        }
      >
        <span className="invisible relative left-[55px] top-[5px] z-[1] inline-block w-[120px] bg-black pb-[10px] pl-[5px] pr-0 pt-[10px] text-left text-white group-hover:visible">
          Season Stats
        </span>
        <FontAwesomeIcon
          icon={faChartSimple}
          size="xl"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
        />
      </Link>
      <Link
        href={"/results"}
        id="results-link"
        className={
          pathname === "/results"
            ? "group relative !box-border h-[50px] w-full cursor-pointer border-l-[3px] border-l-blue-300 bg-gray-500"
            : "group relative !box-border h-[50px] w-full hover:cursor-pointer hover:border-l-[3px] hover:border-l-blue-300 hover:bg-gray-500"
        }
      >
        <span className="invisible relative left-[55px] top-[5px] z-[1] inline-block w-[120px] bg-black pb-[10px] pl-[5px] pr-0 pt-[10px] text-left text-white group-hover:visible">
          Winners & 0'fers
        </span>
        <FontAwesomeIcon
          icon={faFlagCheckered}
          size="xl"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
        />
      </Link>
      <Link
        href={"/games"}
        className={
          pathname === "/games"
            ? "group relative !box-border h-[50px] w-full cursor-pointer border-l-[3px] border-l-blue-300 bg-gray-500"
            : "group relative !box-border h-[50px] w-full hover:cursor-pointer hover:border-l-[3px] hover:border-l-blue-300 hover:bg-gray-500"
        }
      >
        <span className="invisible relative left-[55px] top-[5px] z-[1] inline-block w-[120px] bg-black pb-[10px] pl-[5px] pr-0 pt-[10px] text-left text-white group-hover:visible">
          Week Games
        </span>
        <FontAwesomeIcon
          icon={faCalendar}
          size="xl"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
        />
      </Link>
      {sessionType && sessionType === "admin" && (
        <Link
          href={"/admin_utility"}
          className={
            pathname === "/admin_utility"
              ? "group relative !box-border h-[50px] w-full cursor-pointer border-l-[3px] border-l-blue-300 bg-gray-500"
              : "group relative !box-border h-[50px] w-full hover:cursor-pointer hover:border-l-[3px] hover:border-l-blue-300 hover:bg-gray-500"
          }
        >
          <span className="invisible relative left-[55px] top-[5px] z-[1] inline-block w-[120px] bg-black pb-[10px] pl-[5px] pr-0 pt-[10px] text-left text-white group-hover:visible">
            Admin Utility
          </span>
          <FontAwesomeIcon
            icon={faWrench}
            size="xl"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
          />
        </Link>
      )}
    </div>
  )
}
