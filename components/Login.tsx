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
      className="w-[calc(100vw-50px-20px)] box-border left-1 shadow-md bg-white absolute sm:left-1/2 top-1/2 sm:-translate-x-1/2 -translate-y-1/2 sm:w-[500px] p-5"
      onSubmit={handleFormSubmit}
    >
      <h2 className="text-xl font-bold text-[#007bff]">Login</h2>
      <label className="block text-sm md:text-base text-left mt-1 mb-1">
        Username
      </label>
      <input
        className=" block mt-1 mb-1 outline-none w-full p-1 box-border border border-gray-500 focus:border-2 focus:border-[#007bff]"
        type="text"
        name="username"
        placeholder="username"
        autoComplete="username"
        required
      />
      <label className="mt-1 mb-1 block text-sm md:text-base text-left">
        Password
      </label>
      <input
        className=" block mt-1 mb-1 outline-none w-full p-1 box-border border border-gray-500 focus:border-2 focus:border-[#007bff]"
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
        className="block mb-1 w-full mt-3 cursor-pointer text-white bg-[#007bff] rounded-md p-[10px] border-none hover:bg-blue-400"
      />
      <ReCAPTCHA ref={recaptcha} sitekey={recaptchaSiteKey} size="invisible" />
      {formState?.error && (
        <span className="text-red-500">{formState?.error}</span>
      )}
    </form>
  )
}
