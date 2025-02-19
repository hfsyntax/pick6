"use client"
import type { QueryResultRow } from "@vercel/postgres"
import type { ChangeEvent, MouseEvent, FormEvent } from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { handleAdminForm, revalidateCache } from "../actions/adminRequests"
import { useFormState } from "react-dom"
import { clearUserCredentialsFile } from "../actions/serverRequests"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"

interface ComponentProps {
  season: QueryResultRow[string]
  week: QueryResultRow[string]
  timerStatus: string
  resetTime: string
}

export default function AdminUtilityHandler({
  season,
  week,
  timerStatus,
  resetTime,
}: ComponentProps): JSX.Element {
  const [option, setOption] = useState("Upload Games")
  const [fromFile, setFromFile] = useState(false)
  const [message, showMessage] = useState({ display: "none", text: null })
  const [refreshButton, setRefreshButton] = useState({
    disabled: false,
    text: "Refresh Data",
  })
  const [sumbitButton, setSumbitButton] = useState({
    disabled: false,
    text: "Submit",
  })
  const [formResponse, formAction] = useFormState(handleAdminForm, null)
  const [formMessage, setFormMessage] = useState({ message: null, error: null })
  const currentForm = useRef<HTMLFormElement>()
  const formMessageSet = useRef(false)

  const selectHandler = async (event: ChangeEvent<HTMLSelectElement>) => {
    setOption(event.target.value)
  }

  const checkboxHandler = async (event: MouseEvent<HTMLInputElement>) => {
    event.currentTarget.name === ""
      ? setFromFile(event.currentTarget.checked)
      : null
  }

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    formData.append("option", option)
    formMessageSet.current = false
    formAction(formData)
    setSumbitButton({
      disabled: true,
      text: "Loading...",
    })
  }

  const refreshData = async (event: MouseEvent<HTMLButtonElement>) => {
    setRefreshButton({ text: "loading...", disabled: true })
    const response = await revalidateCache()
    showMessage({ display: "block", text: response })
  }

  const closeModal = () => {
    if (message.display === "block") {
      showMessage({ display: "none", text: null })
      if (refreshButton.disabled)
        setRefreshButton({ text: "Refresh Data", disabled: false })
    }
  }

  const isValidURL = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return true
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    setSumbitButton({ disabled: false, text: "Submit" })
    if (formResponse?.message) {
      if (option === "Upload Picks" && isValidURL(formResponse.message)) {
        fetch(formResponse.message, {
          method: "GET",
          mode: "cors",
        }).then(async (response) => {
          if (response.ok) {
            if (response.status === 204) return // empty user credentials file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.style.display = "none"
            a.href = url
            a.download = "user_credentials.csv"
            a.click()
            window.URL.revokeObjectURL(url)
            const csvresponse = await clearUserCredentialsFile()
            if (csvresponse) {
              showMessage({
                display: "block",
                text: "initiated download for new users csv file and cleared contents of existing server csv file",
              })
            } else {
              showMessage({
                display: "block",
                text: "initiated download for new users csv file but failed to clear existing server csv file",
              })
            }
          } else {
            showMessage({
              display: "block",
              text: "Error: failed to download user credentials",
            })
          }
        })
      }
      // reset the form before setting the form response
      if (option === "Upload Games") {
        formMessageSet.current = true
        setFormMessage({ message: formResponse?.message, error: null })
      } else {
        setOption("Upload Games")
      }

      currentForm?.current?.reset()
    } else if (formResponse?.error) {
      setFormMessage({ message: null, error: formResponse?.error })
    }
  }, [formResponse])

  // clear form message/error on option change
  useEffect(() => {
    if (formResponse?.message) {
      if (!formMessageSet.current) {
        formMessageSet.current = true
        if (isValidURL(formResponse?.message))
          setFormMessage({
            ...formMessage,
            message: "All picks from file created",
          })
        else setFormMessage({ message: formResponse?.message, error: null })
      } else {
        // form success already set
        setFormMessage({ message: null, error: null })
      }
    } else if (formResponse?.error) {
      if (formMessage.error) {
        setFormMessage({ message: null, error: null })
      }
    }
  }, [option])

  return (
    <>
      <div
        className="absolute top-0 left-0 w-full h-full bg-[rgba(0, 0, 0, 0.5)] backdrop-blur-[10px] z-[1]"
        style={{ display: message.display }}
      >
        <div className="shadow-lg bg-white absolute flex items-center flex-col left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[170px] text-center z-[2]">
          <FontAwesomeIcon
            className="mr-auto ml-[5px] cursor-pointer hover:text-gray-500"
            icon={faXmark}
            size="xl"
            onClick={closeModal}
          />
          <span className="relative top-[25px]">{message.text}</span>
          <button
            className="inline-block relative top-[30px] ml-[10px] bg-black text-white p-1 rounded-md hover:bg-gray-500"
            onClick={closeModal}
          >
            Ok
          </button>
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-1">
        Admin Utility
      </h1>
      <div className="border border-black flex flex-col mt-2 p-3">
        <b>
          Admin guide:
          <Link
            className="text-blue-700 hover:text-blue-300"
            href={"/admin_guide"}
          >
            &nbsp;here
          </Link>
        </b>
        <span>
          <b>Season:&nbsp;</b>Week {week} of Season {season}
        </span>
        <span
          className={
            timerStatus === "Paused"
              ? "text-red-500 font-bold"
              : "text-green-500 font-bold"
          }
        >
          <b className="text-black font-bold">Timer status:&nbsp;</b>
          {timerStatus}
        </span>
        <span>
          <b>Timer Ends:&nbsp;</b>
          {resetTime}
        </span>
      </div>

      <button
        className="block mt-[10px] bg-black text-white rounded-md p-2 text-xs sm:text-sm md:text-base cursor-pointer hover:bg-gray-500"
        onClick={refreshData}
        disabled={refreshButton.disabled}
      >
        {refreshButton.text}
      </button>

      <form
        ref={currentForm}
        className="flex items-center flex-col w-full ml-auto mr-auto"
        onSubmit={submitHandler}
      >
        <div className="flex items-center mt-3">
          <label className="text-sm sm:text-base lg:text-xl font-bold">
            Select Task:
          </label>

          <select
            className="m-[10px] border border-black focus:outline-none h-[25px] text-xs lg:text-base text-center w-[155px] lg:w-[200px]"
            onChange={selectHandler}
            defaultValue="Upload Games"
          >
            <option value="Upload Games">Upload Games</option>
            <option value="Upload Picks">Upload Picks</option>
            <option value="Toggle Timer">Toggle Timer</option>
            <option value="Upload Game Results">Upload Game Results</option>
            <option value="Edit Timer">Edit Timer</option>
            <option value="Insert User">Insert User(s)</option>
            <option value="Delete User">Delete User(s)</option>
            <option value="Set Week/Season">Set Week/Season</option>
          </select>
        </div>
        {option === "Upload Games" ? (
          <>
            <span>
              Uploads games for the current week from a games csv file.
            </span>
            <input
              name="fileInput"
              type="file"
              className="block m-[10px] w-fit"
            />
          </>
        ) : option === "Upload Picks" ? (
          <>
            <span>
              Uploads picks for the current week from a picks csv file.
            </span>
            <input
              type="file"
              className="block m-[10px] w-fit"
              name="fileInput"
              required
            />
          </>
        ) : option === "Toggle Timer" ? (
          <>
            <span>
              Sets the timer to either paused or unpaused depending on the
              current state.
            </span>
          </>
        ) : option === "Upload Game Results" ? (
          <>
            <span>
              Uploads the current week games results. If the timer is paused it
              also sets all players week stats, next weeks stats and season
              stats based on the result of a games csv file.
            </span>
            <input
              className="block m-[10px] w-fit"
              type="file"
              name="fileInput"
              required
            />
          </>
        ) : option === "Edit Timer" ? (
          <>
            <span>
              Sets the timers time, if empty timer is set to end 7 days from
              now. See{" "}
              <a href="https://www.npmjs.com/package/ms" target="_blank">
                Format
              </a>
            </span>
            <input
              className="block border border-black focus:outline-none indent-1"
              type="text"
              name="time"
              placeholder="Enter time"
            />
          </>
        ) : option === "Insert User" ? (
          <>
            <span>
              Inserts new users. Format for file uploads is:
              (user,password,gp,type,group_number) per line. Type is either
              admin or user
            </span>
            <div>
              <label>from file</label>
              <input
                className="ml-1"
                type="checkbox"
                onClick={checkboxHandler}
                defaultChecked={fromFile}
              ></input>
            </div>
            {fromFile ? (
              <input
                className="block m-[10px] w-fit"
                type="file"
                name="fileInput"
                required
              />
            ) : (
              <>
                <label>Username</label>
                <input
                  className="block border border-black focus:outline-none indent-1"
                  type="text"
                  name="username"
                  placeholder="username"
                  autoComplete="username"
                  required
                />
                <label>Password</label>
                <input
                  className="block border border-black focus:outline-none indent-1"
                  type="password"
                  name="password"
                  placeholder="password"
                  autoComplete="new-password"
                  required
                />
                <label>Confirm Password</label>
                <input
                  className="block border border-black focus:outline-none indent-1"
                  type="password"
                  name="confirm-password"
                  placeholder="confirm password"
                  autoComplete="new-password"
                  required
                />
                <label>User Type</label>
                <select
                  name="userType"
                  className=" block border border-black focus:outline-none w-[200px] h-[26px] pl-1"
                  required
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <label>Group</label>
                <input
                  className="block border border-black focus:outline-none indent-1"
                  type="text"
                  name="group"
                  placeholder="Group"
                  required
                />
                <label>Group Number</label>
                <input
                  className="block border border-black focus:outline-none indent-1"
                  type="number"
                  name="groupNumber"
                  placeholder="Group Number"
                  required
                />
              </>
            )}
          </>
        ) : option === "Delete User" ? (
          <>
            <span>
              If hard delete is checked all of the users data/stats will be
              removed otherwise it sets user(s) as inactive. Format for file
              uploads is: (user,user ...).
            </span>
            <div>
              <label>from file</label>
              <input
                type="checkbox"
                onClick={checkboxHandler}
                defaultChecked={fromFile}
              ></input>
              <label>Hard Delete</label>
              <input
                type="checkbox"
                name="hardDelete"
                onClick={checkboxHandler}
              ></input>
            </div>
            {fromFile ? (
              <input
                className="block m-[10px] w-fit"
                type="file"
                name="fileInput"
                required
              />
            ) : (
              <input
                className="block border border-black focus:outline-none indent-1"
                type="text"
                name="username"
                placeholder="Username"
                autoComplete="username"
                required
              />
            )}
          </>
        ) : option === "Set Week/Season" ? (
          <>
            <span>
              Sets a week and/or season. If neither are specified the
              week/season will be set to the environment variables set.
            </span>
            <label>Season Number</label>
            <input
              className="block border border-black focus:outline-none indent-1"
              type="number"
              name="season"
              placeholder="Season Number"
            />
            <label>Week Number</label>
            <input
              className="block border border-black focus:outline-none indent-1"
              type="number"
              name="week"
              placeholder="Week Number"
            />
          </>
        ) : null}
        <input
          className="block mt-[10px] mb-2 bg-black text-white rounded-md p-2 text-xs sm:text-sm md:text-base cursor-pointer w-fit hover:bg-gray-500"
          type="submit"
          value={sumbitButton.text}
          disabled={sumbitButton.disabled}
        />
        <ul>
          {formMessage?.message &&
            (formMessage?.message.includes("<br/>") ? (
              formMessage?.message.split("<br/>").map(
                (text, index) =>
                  text !== "" && (
                    <li key={index}>
                      <b className="text-green-500">{text}</b>
                    </li>
                  )
              )
            ) : (
              <li key={"0"}>
                <b className="text-green-500">{formMessage?.message}</b>
              </li>
            ))}
          {formMessage?.error &&
            (formMessage?.error.includes("<br/>") ? (
              formMessage?.error.split("<br/>").map(
                (text, index) =>
                  text !== "" && (
                    <li key={index}>
                      <b className="text-red-500">{text}</b>
                    </li>
                  )
              )
            ) : (
              <li key={"0"}>
                <b className="text-red-500">{formMessage?.error}</b>
              </li>
            ))}
        </ul>
      </form>
    </>
  )
}
