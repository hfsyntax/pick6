"use client"
import { checkSessionTimeout, login } from "../lib/session"
import { getUsersByName } from "../actions/serverRequests"
import { useFormState } from "react-dom"
import { useEffect, useRef, useState } from "react"
import ReCAPTCHA from 'react-google-recaptcha'

export default function Login(): JSX.Element {
    const recaptchaSiteKey = "6LeBoQsqAAAAAPgRejKkDo695uUkDlPre8Os5MyB"
    const recaptcha = useRef<ReCAPTCHA>()
    const currentForm = useRef<HTMLFormElement>()
    const [formResponse, formAction] = useFormState(login, null)
    const [formState, setFormState] = useState({
        error: null,
        disabled: false,
        text: "Login"
    })

    const handleFormSubmit = async event => {
        event.preventDefault()
        await recaptcha.current.executeAsync()
        const formData = new FormData(event.target)
        if (!formData.get("username")) {
            setFormState({
                ...formState,
                error: "username is empty"
            })
        } else if (!formData.get("password")) {
            setFormState({
                ...formState,
                error: `password is empty`
            })
        } else {
            formAction(formData)
            setFormState({
                ...formState,
                disabled: true,
                text: "loading..."
            })
        }
    }

    useEffect(() => {
        if (formResponse?.error) {
            currentForm.current.reset()
            setFormState({
                disabled: false,
                text: "Login",
                error: formResponse?.error
            })
        }  
    }, [formResponse])

    useEffect(() => {
        checkSessionTimeout()
            .then(response => {
                if (response === "session timeout") {
                    setFormState(
                        {
                            ...formState,
                            error: response
                        }
                    )
                }
            })
        // remove localstorage for deleted users
        const users = []
        const userKeys = {}
        for (let key of Object.keys(localStorage)) {
            if (key.includes("_")) {
                const user = key.split("_")[0]
                users.push(user)
                userKeys[user] = key
            }
        }
        if (users.length > 0)
        getUsersByName(users)
        .then(response => {
            const dbUsers = response.map(dbUser => dbUser?.username)
            const nonExistingUsers = users.filter(user => !dbUsers.includes(user))
            for (let nonExistingUser of nonExistingUsers) {
                const key = userKeys[nonExistingUser]
                localStorage.removeItem(key)
            }
        })
    }, [])

    return (
        <form ref={currentForm} id="login" onSubmit={handleFormSubmit}>
            <h2>Login</h2>
            <label>Username</label>
            <input type="text" name="username" placeholder="username" autoComplete="username" required />
            <label>Password</label>
            <input type="password" name="password" placeholder="password" autoComplete="current-password" required />
            <input type="submit" disabled={formState.disabled} value={formState.text} />
            <ReCAPTCHA ref={recaptcha} sitekey={recaptchaSiteKey} size="invisible"/>
            {formState?.error && <span style={{ color: "red" }}>{formState?.error}</span>}
        </form>
    )
}