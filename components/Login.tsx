"use client"
import { checkSessionTimeout, login } from "../lib/session"
import { getUsersByName } from "../actions/serverRequests"
import { useFormState } from "react-dom"
import { useEffect, useRef, useState } from "react"
import ReCAPTCHA from "react-google-recaptcha"

export default function Login(): JSX.Element {
  const recaptchaSiteKey = "6LeBoQsqAAAAAPgRejKkDo695uUkDlPre8Os5MyB"
  const recaptcha = useRef<ReCAPTCHA>()
  const currentForm = useRef<HTMLFormElement>()
  const [formResponse, formAction] = useFormState(login, null)
  const [formState, setFormState] = useState({
    error: null,
    disabled: false,
    text: "Login",
  })

  const handleFormSubmit = async (event) => {
    event.preventDefault()
    await recaptcha.current.executeAsync()
    const formData = new FormData(event.target)
    if (!formData.get("username")) {
      setFormState({
        ...formState,
        error: "username is empty",
      })
    } else if (!formData.get("password")) {
      setFormState({
        ...formState,
        error: `password is empty`,
      })
    } else {
      formAction(formData)
      setFormState({
        ...formState,
        disabled: true,
        text: "loading...",
      })
    }
  }

  useEffect(() => {
    if (formResponse?.error) {
      currentForm.current.reset()
      setFormState({
        disabled: false,
        text: "Login",
        error: formResponse?.error,
      })
    }
  }, [formResponse])

  useEffect(() => {
    checkSessionTimeout().then((response) => {
      if (response === "session timeout") {
        setFormState({
          ...formState,
          error: response,
        })
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
      getUsersByName(users).then((response) => {
        const dbUsers = response.map((dbUser) => dbUser?.username)
        const nonExistingUsers = users.filter((user) => !dbUsers.includes(user))
        for (let nonExistingUser of nonExistingUsers) {
          const key = userKeys[nonExistingUser]
          localStorage.removeItem(key)
        }
      })
  }, [])

  return (
    <form
      id="login"
      ref={currentForm}
      className="absolute left-1 top-1/2 box-border w-[calc(100vw-50px-20px)] -translate-y-1/2 bg-white p-5 shadow-md sm:left-1/2 sm:w-[500px] sm:-translate-x-1/2"
      onSubmit={handleFormSubmit}
    >
      <h2 className="text-xl font-bold text-[#007bff]">Login</h2>
      <label className="mb-1 mt-1 block text-left text-sm md:text-base">
        Username
      </label>
      <input
        className="mb-1 mt-1 box-border block w-full border border-gray-500 p-1 outline-none focus:border-2 focus:border-[#007bff]"
        type="text"
        name="username"
        placeholder="username"
        autoComplete="username"
        required
      />
      <label className="mb-1 mt-1 block text-left text-sm md:text-base">
        Password
      </label>
      <input
        className="mb-1 mt-1 box-border block w-full border border-gray-500 p-1 outline-none focus:border-2 focus:border-[#007bff]"
        type="password"
        name="password"
        placeholder="password"
        autoComplete="current-password"
        required
      />
      <input
        type="submit"
        disabled={formState.disabled}
        value={formState.text}
        className="mb-1 mt-3 block w-full cursor-pointer rounded-md border-none bg-[#007bff] p-[10px] text-white hover:bg-blue-400"
      />
      <ReCAPTCHA ref={recaptcha} sitekey={recaptchaSiteKey} size="invisible" />
      {formState?.error && (
        <span className="text-red-500">{formState?.error}</span>
      )}
    </form>
  )
}
