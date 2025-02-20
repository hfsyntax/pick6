"use client"
import type { FormEvent } from "react"
import {
  useState,
  useEffect,
  useRef,
  useActionState,
  startTransition,
} from "react"
import { changePassword } from "../actions/userRequests"

export default function ChangePassword({ session }) {
  const [showForm, setShowForm] = useState(false)
  const [formResponse, formAction, isPending] = useActionState(
    changePassword,
    null,
  )
  const currentForm = useRef<HTMLFormElement>(null)
  const formMessage = useRef({ message: null, error: null })

  const toggleForm = () => {
    formMessage.current = null
    setShowForm(!showForm)
  }

  const handleForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    startTransition(() => {
      formAction(formData)
    })
  }

  useEffect(() => {
    if (formResponse?.message) {
      formMessage.current = { message: formResponse?.message, error: null }
      currentForm.current.reset()
    } else if (formResponse?.error) {
      formMessage.current = { message: null, error: formResponse?.error }
    }
  }, [formResponse])

  return (
    <>
      <input
        type="button"
        onClick={toggleForm}
        value={showForm ? "Cancel new password" : "Change password"}
        className="m-[10px] ml-auto mr-auto w-fit"
      />
      {showForm && (
        <>
          <form
            className="ml-auto mr-auto flex w-full flex-col items-center"
            ref={currentForm}
            onSubmit={handleForm}
            action={formAction}
          >
            {/* username field required by chrome */}
            <input
              className="hidden"
              type="text"
              value={session?.user?.username}
              autoComplete="username"
              readOnly
            />
            <input
              className="block"
              type="password"
              name="currentPassword"
              placeholder="current password"
              autoComplete="current-password"
              required
            />
            <input
              className="block"
              type="password"
              name="newPassword"
              placeholder="new password"
              autoComplete="new-password"
              required
            />
            <input
              className="block"
              type="password"
              name="confirmNewPassword"
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
            />
            <input
              className="mt-[10px] block"
              type="submit"
              value={isPending ? "Loading..." : "Submit"}
              disabled={isPending}
            />
          </form>
          {formMessage?.current?.message && (
            <b className="text-green-500">{formMessage?.current?.message}</b>
          )}
          {formMessage?.current?.error && (
            <b className="text-red-500">{formMessage?.current?.error}</b>
          )}
        </>
      )}
    </>
  )
}
