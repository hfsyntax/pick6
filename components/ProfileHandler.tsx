import { getUserWeekPicks, getUserSeasonsData, getUser, getConfigValue } from "../actions/serverRequests";
import OptimizedTable from "./OptimizedTable";

export default async function ProfileHandler({ id }: {id: string}): Promise<JSX.Element> {
    const currentSeason = await getConfigValue("CURRENT_SEASON")
    const currentWeek = await getConfigValue("CURRENT_WEEK")
    const user = await getUser(id)
    const weekPicks = await getUserWeekPicks(id)
    const seasonData = await getUserSeasonsData(id)
    return (
        (user ?
            <>
            <h1>Picks for Week {currentWeek} of Season {currentSeason}</h1>
                {weekPicks?.picks.length > 0 ?
                    (
                        <>
                            <OptimizedTable
                                headers={weekPicks.headers}
                                rows={weekPicks.picks}
                            />
                        </>
                    )
                    : <h3 style={{color: "red"}}>None</h3>}
                    <h1>Season Data</h1>
                {seasonData.length > 0 ?
                    <>
                        <OptimizedTable
                            headers={["Season", "#", "GP", "Name", "Rank", "Won", "Played", "%"]}
                            rows={seasonData}
                        />
                    </>
                    : <h3 style={{color: "red"}}>None</h3>}

            </> : <h3 style={{color: "red"}}>user not found</h3>)

    )
}