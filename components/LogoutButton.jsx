"use client"
import { logout } from "../lib/session";
import { useFormState } from "react-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import { useRef } from "react";

export default function LogoutButton() {
    const [formResponse, formAction] = useFormState(logout, null)
    const currentForm = useRef()
    const handleSubmit = () => {
        currentForm.current.requestSubmit()
    }
    return (
        <form ref={currentForm} action={formAction}>
            <FontAwesomeIcon onClick={handleSubmit} icon={faRightFromBracket} size="2xl" />
        </form> 
    )
}