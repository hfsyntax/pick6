"use client"
import { logout } from "../lib/session";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons"

export default function LogoutButton(): JSX.Element {
    const handleSubmit = async () => {
        await logout()
    }
    return (
        <FontAwesomeIcon onClick={handleSubmit} icon={faRightFromBracket} size="2xl" />
    )
}