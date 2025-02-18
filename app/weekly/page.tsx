import {
  getWeeks,
  getPicks,
  getConfigValue,
} from "../../actions/serverRequests"
import SeasonWeeksHandler from "../../components/SeasonWeeksHandler"

export const metadata = {
  title: "Pick6 - Weekly",
  description: "Generated by create next app",
}

export default async function Weekly(): Promise<JSX.Element> {
  const currentSeason = await getConfigValue("CURRENT_SEASON")
  const currentWeek = await getConfigValue("CURRENT_WEEK")
  const weeks = await getWeeks()
  const weekID = weeks.find(
    (week) =>
      week.season_number == currentSeason && week.week_number == currentWeek
  )?.week_id
  const picks = await getPicks(currentSeason, currentWeek, "asc", ["rank"])
  const columnWidths = {
    rank: { small: 25, medium: 35, large: 50 },
    gp: { small: 25, medium: 35, large: 50 },
    group_number: { small: 25, medium: 35, large: 50 },
    win_percentage: { small: 25, medium: 35, large: 50 },
    won: { small: 25, medium: 35, large: 50 },
    played: { small: 50, medium: 50, large: 50 },
    player_name: { small: 100, medium: 140, large: 150 },
    pick1: { small: 60, medium: 90, large: 90 },
    pick2: { small: 60, medium: 90, large: 90 },
    pick3: { small: 60, medium: 90, large: 90 },
    pick4: { small: 60, medium: 90, large: 90 },
    pick5: { small: 60, medium: 90, large: 90 },
    pick6: { small: 60, medium: 90, large: 90 },
  }
  return (
    <div className="absolute top-0 left-[50px] w-[calc(100%-50px)] min-h-full flex flex-col text-center items-center overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-1">
        Week Picks
      </h1>
      {weeks.length > 0 ? (
        <SeasonWeeksHandler
          currentSeason={currentSeason}
          currentWeek={currentWeek}
          selectedId={weekID}
          selectOptions={weeks}
          initialData={picks.picks}
          headers={picks.headers}
          columnWidths={columnWidths}
        />
      ) : (
        <h3 className="text-red-500">no data</h3>
      )}
    </div>
  )
}
