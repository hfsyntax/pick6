"use client"
import { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import { handlePicks } from "../actions/userRequests";
import { getSession } from "../lib/session";
import Table from './Table'

export default function TeamsHandler({ weekGames, timerPaused, timerTime, currentSeason, currentWeek }) {
  const [countdown, setCountdown] = useState()
  const [formResponse, formAction] = useFormState(handlePicks, null)
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
    const formData = new FormData(event.target)
    const teamCheckboxes = document.querySelectorAll("input[type='checkbox']")
    for (let checkbox of teamCheckboxes) {
      const teamID = checkbox.name
      const key = `${username}_${teamID}`
      if (checkbox.checked) {
        localStorage.setItem(key, `${currentSeason}-${currentWeek}`)
      } else {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
        }
      }
    }
    formAction(formData)
  }

  useEffect(() => {
    getSession()
      .then(result => {
        const teamCheckboxes = document.querySelectorAll("input[type='checkbox']")
        for (let checkbox of teamCheckboxes) {
          const teamID = checkbox.name
          const username = result?.user?.username
          const key = `${username}_${teamID}`
          if (localStorage.getItem(key)) {
            const valueTimestamp = localStorage.getItem(key).split("-")
            const seasonTimestamp = valueTimestamp[0]
            const weekTimestamp = valueTimestamp[1]
            if (currentSeason === seasonTimestamp && currentWeek === weekTimestamp) {
              checkbox.checked = true
            } else {
              localStorage.removeItem(key)
            }
          }
        }
      })

    updateCountdown(timerTime, timerPaused)
  }, [])

  return (
    <>
      <h2>Time Remaining: {countdown}</h2>
      <form className="default-form" onSubmit={submitHandler}>
        {!timerPaused && <input type="submit" value="submit" />}
        <Table
          className={"table-wrapper"}
          headers={["Game", "Favorite", "Spread", "Underdog"]}
          rows={weekGames}
        />
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