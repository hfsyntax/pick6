import {
  getWeekGameResults,
  getWeeks,
  getConfigValue,
} from "../../actions/serverRequests"
import SeasonWeeksHandler from "../../components/SeasonWeeksHandler"

export const metadata = {
  title: "Pick6 - Games",
  description: "Generated by create next app",
}

export default async function Games(props: {
  searchParams?: Promise<{
    season?: string
    week?: string
  }>
}) {
  const searchParams = await props.searchParams
  const currentSeason = Number(
    searchParams.season ?? (await getConfigValue("CURRENT_SEASON")),
  )
  const currentWeek = Number(
    searchParams.week ?? (await getConfigValue("CURRENT_WEEK")),
  )
  const headers = [
    "#",
    "Pts",
    "Favorite",
    "Spread",
    "Underdog",
    "Pts",
    "Covering Team",
  ]
  const games = await getWeekGameResults(currentSeason, currentWeek)
  const weeks = await getWeeks()
  const weekID = weeks.find(
    (week) =>
      week.season_number == currentSeason && week.week_number == currentWeek,
  )?.week_id
  const columnWidths = {
    game_counter: { small: 25, medium: 70, large: 100 },
    favorite_score: { small: 25, medium: 70, large: 100 },
    favorite: { small: 50, medium: 120, large: 200 },
    underdog_score: { small: 25, medium: 70, large: 100 },
    underdog: { small: 50, medium: 120, large: 200 },
    winner: { small: 80, medium: 120, large: 200 },
    spread: { small: 32, medium: 70, large: 100 },
  }
  return (
    <div className="absolute left-[50px] top-0 flex min-h-full w-[calc(100%-50px)] flex-col items-center overflow-x-hidden text-center">
      <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
        Games
      </h1>
      {weeks.length > 0 ? (
        weekID ? (
          <SeasonWeeksHandler
            currentSeason={currentSeason}
            currentWeek={currentWeek}
            selectedId={weekID}
            selectOptions={weeks}
            data={games}
            originalDataExists={games.length > 0}
            headers={headers}
            columnWidths={columnWidths}
          />
        ) : (
          <span className="text-red-500">
            Week {currentWeek} does not exist for Season {currentSeason}
          </span>
        )
      ) : (
        <h3 className="text-red-500">No weeks exist</h3>
      )}
    </div>
  )
}
