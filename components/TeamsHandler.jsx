"use client"
import { useEffect, useRef, useState } from "react"
import { useFormState } from "react-dom"
import { handlePicks } from "../actions/userRequests";
import { getSession } from "../lib/session";
import OptimizedTable from "./OptimizedTable";

export default function TeamsHandler({ weekGames, timerPaused, timerTime, currentSeason, currentWeek }) {
  const [countdown, setCountdown] = useState()
  const [formResponse, formAction] = useFormState(handlePicks, null)
  const [storePicks, setStorePicks] = useState({ key: null, values: null })
  const currentForm = useRef()
  const updateCountdown = (timeUntilReset, paused) => {
    // Convert the time until reset to days, hours, minutes, and seconds
    const days = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);

    // Update the countdown display
    if (!paused) {
      setCountdown(`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
      setTimeout(() => {
        timeUntilReset -= 1000;
        updateCountdown(timeUntilReset, paused);
      }, 1000);
    } else {
      setCountdown("Paused")
    }
  }

  const submitHandler = async (event) => {
    event.preventDefault()
    const session = await getSession()
    const username = session?.user?.username
    const teamCheckboxes = document.querySelectorAll("input[type='checkbox']")
    const selections = {}
    for (let checkbox of teamCheckboxes) {
      const teamID = checkbox.name
      if (checkbox.checked) {
        selections[teamID] = `${currentSeason}-${currentWeek}`
      }
    }
    setStorePicks({ key: `${username}_picks`, values: JSON.stringify(selections, null, 2) })
  }

  // wait for picks to be set to localstorage before validating
  useEffect(() => {
    if (storePicks?.key && storePicks?.values) {
      const formData = new FormData(currentForm.current)
      formAction(formData)
    }
  }, [storePicks])

  // on form success set picks to localstorage
  useEffect(() => {
    if (formResponse?.message) {
      localStorage.setItem(storePicks.key, storePicks.values)
    }
  }, [formResponse])

  useEffect(() => {
    getSession()
      .then(result => {
        const teamCheckboxes = document.querySelectorAll("input[type='checkbox']")
        const username = result?.user?.username
        const picks = JSON.parse(localStorage.getItem(`${username}_picks`))
        if (picks) {
          // every pick matches current week
          const picksCurrentWeek = Object.values(picks).every(value => {
            const [season, week] = value.split('-');
            return season === currentSeason && week === currentWeek;
          })
          if (!picksCurrentWeek) {
            localStorage.removeItem(`${username}_picks`)
          } else {
            // every pick matches a game id for the current week
            const checkboxNames = Array.from(teamCheckboxes).map(checkbox => checkbox.name)
            const picksMatchGames = Object.keys(picks).every(gameId => checkboxNames.includes(gameId));
            if (!picksMatchGames) {
              localStorage.removeItem(`${username}_picks`)
            } else {
              // restore checkbox state for selected teams
              for (let checkbox of teamCheckboxes) {
                for (let teamid of Object.keys(picks)) {
                  if (checkbox.name === teamid) {
                    checkbox.checked = true
                  }
                }
              }
            }
          }
        }
      })

    updateCountdown(timerTime, timerPaused)
  }, [])

  return (
    <>
      <h2>Time Remaining: {countdown}</h2>
      <form ref={currentForm} className="default-form" onSubmit={submitHandler}>
        {!timerPaused && <input type="submit" value="submit" />}
        {weekGames?.length > 0 ?
          <OptimizedTable
            headers={["Game", "Favorite", "Spread", "Underdog"]}
            rows={weekGames}
          /> : <h3 style={{ color: "red" }}>no data</h3>
        }
        <ul>
          {formResponse?.message &&
            (formResponse?.message.includes("<br/>") ?
              formResponse?.message.split("<br/>").map((text, index) => (
                text !== "" && <li key={index}><b style={{ color: "green" }}>{text}</b></li>
              ))
              : <li key={"0"}><b style={{ color: "green" }}>{formResponse?.message}</b></li>)
          }
          {formResponse?.error &&
            (formResponse?.error.includes("<br/>") ?
              formResponse?.error.split("<br/>").map((text, index) => (
                text !== "" && <li key={index}><b style={{ color: "red" }}>{text}</b></li>
              ))
              : <li key={"0"}><b style={{ color: "red" }}>{formResponse?.error}</b></li>)
          }
        </ul>
      </form>
    </>
  )
}