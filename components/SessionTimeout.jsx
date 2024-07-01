"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import { getSession, redirectToLogin } from "../lib/session"

export default function SessionTimeout() {
    const [message, showMessage] = useState("none")
    const [redirectTimeout, setRedirectTimeout] = useState()
    
    const promptSessionTimeout = async () => {
        const session = await getSession()
        const sessionExpiration = (session?.exp - Math.floor(Date.now() / 1000)) * 1000
        const fiveMinutes = 60 * 5 * 1000
        const warningTimeout = setTimeout(async () => {
            if (session) {
                showMessage("block")
            }
        }, sessionExpiration - fiveMinutes);

        const redirectTimeout = setTimeout(async () => {
            await redirectToLogin()
        }, sessionExpiration);

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
                if (redirectTimeout)
                clearTimeout(redirectTimeout)
                await promptSessionTimeout()
            }
        }
    }

    const closeModal = () => {
        if (message === "block")
        showMessage("none")
    }

    useEffect(() => {
        promptSessionTimeout() 
    }, [])
    
    return (
        <div id="modal-overlay" style={{display: message}}>
                <div id="modal">
                <FontAwesomeIcon icon={faXmark} size="xl" onClick={closeModal}/>
                    <span>your session expires in 5 minutes, click ok to reset your session time</span>
                    <button onClick={requestNewSession}>Ok</button>
                </div>
        </div>
    )
}