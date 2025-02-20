import {
  getUserWeekPicks,
  getUserSeasonsData,
  getUser,
  getConfigValue,
} from "../actions/serverRequests"
import FixedTable from "./FixedTable"

export default async function ProfileHandler({ id }: { id: string }) {
  const currentSeason = await getConfigValue("CURRENT_SEASON")
  const currentWeek = await getConfigValue("CURRENT_WEEK")
  const user = await getUser(id)
  const weekPicks = await getUserWeekPicks(id)
  const seasonData = await getUserSeasonsData(id)
  const picksColumnWidths = {
    name: { small: 100, medium: 100, large: 150 },
    pick1: { small: 60, medium: 90, large: 90 },
    pick2: { small: 60, medium: 90, large: 90 },
    pick3: { small: 60, medium: 90, large: 90 },
    pick4: { small: 60, medium: 90, large: 90 },
    pick5: { small: 60, medium: 90, large: 90 },
    pick6: { small: 60, medium: 90, large: 90 },
  }
  const seasonStatsColumnWidths = {
    season_number: { small: 35, medium: 100, large: 150 },
    group_number: { small: 25, medium: 90, large: 90 },
    gp: { small: 25, medium: 90, large: 90 },
    name: { small: 100, medium: 90, large: 90 },
    rank: { small: 25, medium: 90, large: 90 },
    won: { small: 25, medium: 90, large: 90 },
    played: { small: 25, medium: 90, large: 90 },
    win_percentage: { small: 25, medium: 90, large: 90 },
  }

  return user ? (
    <>
      <h1>
        Picks for Week {currentWeek} of Season {currentSeason}
      </h1>
      {weekPicks?.picks.length > 0 ? (
        <>
          <FixedTable
            data={[weekPicks.picks[0], ...weekPicks.picks]}
            columns={weekPicks.headers}
            columnWidths={picksColumnWidths}
            height="100px"
          />
        </>
      ) : (
        <h3 className="text-red-500">None</h3>
      )}
      <h1>Season Data</h1>
      {seasonData.length > 0 ? (
        <>
          {
            <FixedTable
              data={[seasonData[0], ...seasonData]}
              columns={[
                "Season",
                "#",
                "GP",
                "Name",
                "Rank",
                "Won",
                "Played",
                "%",
              ]}
              columnWidths={seasonStatsColumnWidths}
              height="100px"
            />
          }
        </>
      ) : (
        <h3 className="text-red-500">None</h3>
      )}
    </>
  ) : (
    <h3 className="text-red-500">user not found</h3>
  )
}
