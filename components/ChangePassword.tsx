"use client"
import { useState, useEffect, useRef, FormEvent } from "react"
import { useFormState } from "react-dom"
import { changePassword } from "../actions/userRequests"

export default function ChangePassword({session}): JSX.Element {
    const [showForm, setShowForm] = useState(false)
    const [formResponse, formAction] = useFormState(changePassword, null)
    const currentForm = useRef<HTMLFormElement>()
    const formMessage = useRef({message: null, error: null})
    const [sumbitButton, setSumbitButton] = useState({disabled: false, text: "Submit"})

    const toggleForm = () => {
        formMessage.current = null
        setShowForm(!showForm)
    }

    const handleForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.target as HTMLFormElement)
        formAction(formData)
        setSumbitButton({
            disabled: true,
            text: "Loading..."
        })
    }

    useEffect(() => {
        setSumbitButton({ disabled: false, text: "Submit" })
        if (formResponse?.message) {
            formMessage.current = {message: formResponse?.message, error: null}
            currentForm.current.reset()
        } else if (formResponse?.error) {
            formMessage.current = {message: null, error: formResponse?.error} 
        }
    }, [formResponse])

    return (
        <>
            <input
                type="button"
                onClick={toggleForm}
                value={showForm ? "Cancel new password" : "Change password"}
                style={{ margin: "10px", width: "fit-content", marginLeft: "auto", "marginRight": "auto" }}
            />
            {showForm && (
                <>
                    <form className="default-form" ref={currentForm} onSubmit={handleForm}>
                        {/* username field required by chrome */}
                        <input type="text" value={session?.user?.username} autoComplete="username" style={{display: "none"}} readOnly/>
                        <input type="password" name="currentPassword" placeholder="current password" autoComplete="current-password" required />
                        <input type="password" name="newPassword" placeholder="new password" autoComplete="new-password" required />
                        <input type="password" name="confirmNewPassword" placeholder="Confirm new password" autoComplete="new-password" required />
                        <input type="submit" value={sumbitButton.text} disabled={sumbitButton.disabled} />
                    </form>
                    {formMessage?.current?.message && <b style={{color: "green"}}>{formMessage?.current?.message}</b>} 
                    {formMessage?.current?.error && <b style={{color: "red"}}>{formMessage?.current?.error}</b>} 
                </>
            )}
        </>
    )
}