import type { MetadataRoute } from "next"
import { getConfigValue } from "../actions/serverRequests"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const weekStatsLastModified = Number(await getConfigValue("weekStatsUpdated"))
  const weekGamesLastModified = Number(await getConfigValue("weekGamesUpdated"))
  const weekResultsLastModified = Number(
    await getConfigValue("weekResultsUpdated"),
  )
  const seasonStatsLastModified = Number(
    await getConfigValue("seasonStatsUpdated"),
  )
  return [
    {
      url: `${process.env.WINDOW_ORIGIN}`,
      lastModified: "2025-04-09T06:55:20.021Z",
      changeFrequency: "never",
      priority: 1,
    },
    {
      url: `${process.env.WINDOW_ORIGIN}/teams`,
      lastModified:
        weekGamesLastModified > 0
          ? new Date(weekGamesLastModified)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${process.env.WINDOW_ORIGIN}/weekly`,
      lastModified:
        weekStatsLastModified > 0
          ? new Date(weekStatsLastModified)
          : new Date(),
      changeFrequency: "hourly",
      priority: 0.5,
    },
    {
      url: `${process.env.WINDOW_ORIGIN}/games`,
      lastModified:
        weekGamesLastModified > 0
          ? new Date(weekGamesLastModified)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${process.env.WINDOW_ORIGIN}/results`,
      lastModified:
        weekResultsLastModified > 0
          ? new Date(weekResultsLastModified)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${process.env.WINDOW_ORIGIN}/season`,
      lastModified:
        seasonStatsLastModified > 0
          ? new Date(seasonStatsLastModified)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ]
}
