import {
  getSeasons,
  getWeekResults,
  getConfigValue,
} from "../../actions/serverRequests"
import SeasonWeeksHandler from "../../components/SeasonWeeksHandler"

export const metadata = {
  title: "Pick6 - Results",
  description: "Generated by create next app",
}

export default async function results(): Promise<JSX.Element> {
  const currentSeason = await getConfigValue("CURRENT_SEASON")
  const currentWeek = await getConfigValue("CURRENT_WEEK")
  const results = await getWeekResults(
    currentSeason,
    currentSeason,
    currentWeek
  )
  const seasons = await getSeasons()
  const seasonID = seasons.find(
    (season) => season.season_number == currentSeason
  )?.season_id
  const columnWidths = {
    week_number: { small: 40, medium: 70, large: 100 },
    winner_names: { small: 100, medium: 200, large: 200 },
    loser_names: { small: 100, medium: 200, large: 200 },
  }

  const rowHeights = [
    35,
    ...results.map((week) => {
      const maxPlayers = Math.max(
        week["winners_count"],
        week["losers_count"],
        1
      )
      // 35px row height + gap of 10px between each row
      return maxPlayers * 35 + (maxPlayers - 1) * 10
    }),
  ]

  return (
    <div className="absolute top-0 left-[50px] w-[calc(100%-50px)] min-h-full flex flex-col text-center items-center overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-1">
        Winners & 0'fers
      </h1>
      {seasons.length > 0 ? (
        <SeasonWeeksHandler
          currentSeason={currentSeason}
          currentWeek={currentWeek}
          selectedId={seasonID}
          selectOptions={seasons}
          initialData={results}
          headers={["Week #", "0'fers", "Winners"]}
          columnWidths={columnWidths}
          rowHeights={rowHeights}
        />
      ) : (
        <h3 className="text-red-500">no data</h3>
      )}
    </div>
  )
}
