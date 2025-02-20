"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import { getSession, redirectToLogin } from "../lib/session"

export default function SessionTimeout() {
  const [message, showMessage] = useState("none")
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout>()

  const promptSessionTimeout = async () => {
    const session = await getSession()
    const sessionExpiration =
      (session?.exp - Math.floor(Date.now() / 1000)) * 1000
    const fiveMinutes = 60 * 5 * 1000
    const warningTimeout = setTimeout(async () => {
      if (session) {
        showMessage("block")
      }
    }, sessionExpiration - fiveMinutes)

    const redirectTimeout = setTimeout(async () => {
      await redirectToLogin()
    }, sessionExpiration)

    setRedirectTimeout(redirectTimeout)

    return () => {
      clearTimeout(warningTimeout)
      clearTimeout(redirectTimeout)
    }
  }

  const requestNewSession = async () => {
    const session = await getSession()
    if (session) {
      showMessage("none")
      const response = await fetch("/api/newSession")
      if (response.ok) {
        if (redirectTimeout) clearTimeout(redirectTimeout)
        await promptSessionTimeout()
      }
    }
  }

  const closeModal = () => {
    if (message === "block") showMessage("none")
  }

  useEffect(() => {
    promptSessionTimeout()
  }, [])

  return (
    <div
      className="bg-[rgba(0, 0, 0, 0.5)] absolute left-0 top-0 z-[1] h-full w-full backdrop-blur-[10px]"
      style={{ display: message }}
    >
      <div className="showing:bg-white absolute left-1/2 top-1/2 z-[2] flex h-[130px] w-[250px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        <FontAwesomeIcon
          className="ml-[5px] mr-auto cursor-pointer"
          icon={faXmark}
          size="xl"
          onClick={closeModal}
        />
        <span className="relative top-[25px]">
          your session expires in 5 minutes, click ok to reset your session time
        </span>
        <button
          className="relative top-[30px] ml-[10px] inline-block"
          onClick={requestNewSession}
        >
          Ok
        </button>
      </div>
    </div>
  )
}
