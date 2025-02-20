import {
  getWeekGames,
  isTimerPaused,
  calculateTimeUntilReset,
  getConfigValue,
} from "../../actions/serverRequests"
import TeamsHandler from "../../components/TeamsHandler"

export const metadata = {
  title: "Pick6 - Teams",
  description: "Generated by create next app",
}

export default async function Teams() {
  const currentSeason = await getConfigValue("CURRENT_SEASON")
  const currentWeek = await getConfigValue("CURRENT_WEEK")
  const weekGames = await getWeekGames(currentSeason, currentWeek)
  const timerPaused = await isTimerPaused()
  const timerTime = await calculateTimeUntilReset()
  return (
    <div className="absolute left-[50px] top-0 flex min-h-full w-[calc(100%-50px)] flex-col items-center overflow-x-hidden text-center">
      {weekGames?.length > 0 && (
        <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
          Week {currentWeek ? currentWeek : "N/A"} of Season{" "}
          {currentSeason ? currentSeason : "N/A"}
        </h1>
      )}
      {currentSeason && currentWeek ? (
        <TeamsHandler
          weekGames={weekGames}
          timerPaused={timerPaused}
          timerTime={timerTime}
          currentSeason={currentSeason}
          currentWeek={currentWeek}
        />
      ) : (
        <h3 className="text-red-500">no data</h3>
      )}
    </div>
  )
}
