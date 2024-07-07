"use client"
import { checkSessionTimeout, login } from "../lib/session"
import { getUsersByName } from "../actions/serverRequests"
import { useFormState } from "react-dom"
import { useEffect, useRef, useState } from "react"

export default function Login() {
    const currentForm = useRef()
    const [formResponse, formAction] = useFormState(login, null)
    const [formState, setFormState] = useState({
        error: null,
        disabled: false,
        text: "Login"
    })

    const handleFormSubmit = event => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
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
                if (response && response === "session timeout") {
                    setFormState(
                        {
                            ...formState,
                            error: response
                        }
                    )
                }
            })
        // remove localstorage for deleted users
        const users = new Set()
        for (let key of Object.keys(localStorage)) {
            if (key.includes("_")) {
                const user = key.split("_")[0]
                users.add(user)
            }
        }
        if (users.size > 0)
        getUsersByName([...users])
        .then(response => {
            const nonExistingUsers = response?.filter(dbUsers => !users.has(dbUsers?.username))
            for (let nonExistingUser of nonExistingUsers) {
                for (let key of Object.keys(localStorage)) {
                    if (key.includes("_")) {
                        const user = key.split("_")[0]
                        if (nonExistingUser?.username === user) {
                            localStorage.removeItem(key)
                        }
                    }
                }
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
            {formState?.error && <span style={{ color: "red" }}>{formState?.error}</span>}
        </form>
    )
}