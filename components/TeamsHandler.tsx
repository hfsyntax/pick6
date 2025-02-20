"use client"
import type { FormEvent } from "react"
import type { QueryResultRow } from "@vercel/postgres"
import type { FormResult } from "../actions/adminRequests"
import { useEffect, useRef, useState } from "react"
import { handlePicks } from "../actions/userRequests"
import { getSession } from "../lib/session"
import FixedTable from "./FixedTable"

interface ComponentProps {
  weekGames: QueryResultRow[]
  timerPaused: boolean
  timerTime: number
  currentSeason: QueryResultRow[string]
  currentWeek: QueryResultRow[string]
}

export default function TeamsHandler({
  weekGames,
  timerPaused,
  timerTime,
  currentSeason,
  currentWeek,
}: ComponentProps) {
  const [countdown, setCountdown] = useState<string>()
  const [formResponse, setFormResponse] = useState<FormResult>()
  const [selectedTeams, setSelectedTeams] = useState<{
    [key: string]: boolean
  }>({})
  const currentForm = useRef<HTMLFormElement>(null)
  const updateCountdown = (timeUntilReset: number, paused: boolean) => {
    // Convert the time until reset to days, hours, minutes, and seconds
    const days = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    )
    const minutes = Math.floor(
      (timeUntilReset % (1000 * 60 * 60)) / (1000 * 60),
    )
    const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000)

    // Update the countdown display
    if (!paused) {
      setCountdown(
        `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`,
      )
      setTimeout(() => {
        timeUntilReset -= 1000
        updateCountdown(timeUntilReset, paused)
      }, 1000)
    } else {
      setCountdown("Paused")
    }
  }

  const handleCheckboxChange = (teamId: string, checked: boolean) => {
    setSelectedTeams((prev) => {
      const updatedTeams = { ...prev }
      if (checked) {
        updatedTeams[teamId] = true
      } else {
        delete updatedTeams[teamId]
      }
      return updatedTeams
    })
  }

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(currentForm.current)
    const response = await handlePicks(formData)
    setFormResponse(response)
  }

  useEffect(() => {
    getSession().then((result) => {
      const username = result?.user?.username
      const picks: object | null = JSON.parse(
        localStorage.getItem(`${username}_picks`),
      )
      if (picks) {
        // every pick matches current week
        const picksCurrentWeek = Object.values(picks).every((value: string) => {
          const [season, week] = value.split("-")
          return season === currentSeason && week === currentWeek
        })
        if (!picksCurrentWeek) {
          localStorage.removeItem(`${username}_picks`)
        } else {
          // restore checkbox state for selected teams
          const restoredTeams = Object.keys(picks).reduce(
            (acc, key) => {
              acc[key] = true
              return acc
            },
            {} as { [key: string]: boolean },
          )
          setSelectedTeams(restoredTeams)
        }
      }
    })

    updateCountdown(timerTime, timerPaused)
  }, [])

  useEffect(() => {
    // form success
    if (formResponse?.message) {
      getSession().then((response) => {
        const username = response?.user?.username
        if (username) {
          const selections = {}
          const teamIds = Object.keys(selectedTeams)
          for (let teamId of teamIds) {
            selections[teamId] = `${currentSeason}-${currentWeek}`
          }
          localStorage.setItem(
            `${username}_picks`,
            JSON.stringify(selections, null, 2),
          )
        }
      })
    }
  }, [formResponse])

  return (
    <>
      <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl">
        Time Remaining: {countdown}
      </h2>
      <form
        ref={currentForm}
        className="ml-auto mr-auto flex w-full flex-col items-center"
        onSubmit={submitHandler}
      >
        {!timerPaused && (
          <input
            type="submit"
            value="submit"
            className="mt-[10px] block cursor-pointer rounded-md bg-black p-2 text-xs text-white hover:bg-gray-500 sm:text-sm md:text-base"
          />
        )}
        {weekGames?.length > 0 ? (
          <FixedTable
            data={[weekGames[0], ...weekGames]}
            columns={["Game", "Favorite", "Spread", "Underdog"]}
            columnWidths={{
              game_counter: { small: 50, medium: 100, large: 200 },
              favorite_team: { small: 100, medium: 200, large: 300 },
              spread: { small: 50, medium: 100, large: 165 },
              underdog_team: { small: 100, medium: 200, large: 300 },
            }}
            selectedCheckboxes={selectedTeams}
            onCheckboxChange={handleCheckboxChange}
          />
        ) : (
          <h3 className="text-red-500">no data</h3>
        )}
        <ul>
          {formResponse?.message &&
            (formResponse?.message.includes("<br/>") ? (
              formResponse?.message.split("<br/>").map(
                (text, index) =>
                  text !== "" && (
                    <li key={index}>
                      <b className="text-green-500">{text}</b>
                    </li>
                  ),
              )
            ) : (
              <li key={"0"}>
                <b className="text-green-500">{formResponse?.message}</b>
              </li>
            ))}
          {formResponse?.error &&
            (formResponse?.error.includes("<br/>") ? (
              formResponse?.error.split("<br/>").map(
                (text, index) =>
                  text !== "" && (
                    <li key={index}>
                      <b className="text-red-500">{text}</b>
                    </li>
                  ),
              )
            ) : (
              <li key={"0"}>
                <b className="text-red-500">{formResponse?.error}</b>
              </li>
            ))}
        </ul>
      </form>
    </>
  )
}
