"use client"
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { handleAdminForm, revalidateCache } from "../actions/adminRequests";
import { useFormState } from "react-dom"
import { clearUserCredentialsFile } from "../actions/serverRequests";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"

export default function AdminUtilityHandler({ season, week, timerStatus, resetTime }) {
    const [option, setOption] = useState("Upload Games")
    const [fromFile, setFromFile] = useState(false)
    const [message, showMessage] = useState({display: "none", text: null})
    const currentForm = useRef()
    const [sumbitButton, setSumbitButton] = useState({
        disabled: false,
        text: "Submit"
    })
    const [formResponse, formAction] = useFormState(handleAdminForm, null)

    const selectHandler = async (event) => {
        setOption(event.target.value)
    }

    const checkboxHandler = async (event) => {
        event.target.name === "" ?
            setFromFile(event.target.checked) : null
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        const formData = new FormData(event.target)
        formData.append("option", option)
        formAction(formData)
        setSumbitButton({
            disabled: true,
            text: "Loading..."
        })
    }

    const refreshData = async (event) => {
        const response = await revalidateCache()
        showMessage({display: "block", text: response})
    }

    const closeModal = () => {
        if (message.display === "block")
        showMessage({display: "none", text: null})
    }

    useEffect(() => {
        setSumbitButton({ disabled: false, text: "Submit" })
        if (formResponse?.message && option === "Upload Picks") {
            fetch("/api/downloadCredentials")
                .then(async response => {
                    if (response.ok) {
                        if (response.status === 204) return // empty user credentials file
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.style.display = "none"
                        a.href = url
                        a.download = 'user_credentials.csv'
                        a.click()
                        window.URL.revokeObjectURL(url)
                        const csvresponse = await clearUserCredentialsFile()
                        if (csvresponse) {
                            showMessage({display: "block", text: "initiated download for new users csv file and cleared contents of existing server csv file"})
                        } else {
                            showMessage({display: "block", text: "initiated download for new users csv file but failed to clear existing server csv file"})
                        }
                    } else {
                        showMessage({display: "block", text: "Error: failed to download user credentials"})
                    }
                })
        }
        if (formResponse?.message) {
            currentForm.current.reset()
            setOption("Upload Games")
        }
    }, [formResponse])

    return (
        <>
            <div id="modal-overlay" style={{ display: message.display }}>
                <div id="modal">
                    <FontAwesomeIcon icon={faXmark} size="xl" onClick={closeModal} />
                    <span>{message.text}</span>
                    <button onClick={closeModal}>Ok</button>
                </div>
            </div>
            <h1>Pick6 - Admin Utility</h1>
            <b>Admin guide: <Link style={{ color: "inherit" }} href={"/admin_guide"}>here</Link></b>
            <span><b>Current:&nbsp;</b>Week {week} of Season {season}</span>
            <span><b>Timer status:&nbsp;</b>{timerStatus}</span>
            <span><b>Timer Ends:&nbsp;</b>{resetTime}</span>
            <button style={{width: "fit-content"}} onClick={refreshData}>Refresh Data</button>

            <form className="default-form" ref={currentForm} onSubmit={submitHandler}>
                <div>
                    <b style={{ marginRight: "10px" }}>Select Task:</b>
                    <select onChange={selectHandler} defaultValue="Upload Games">
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
                {
                    option === "Upload Games" ?
                        <>
                            <span>Uploads games for the current week from a games csv file.</span>
                            <input name="fileInput" type="file" />
                        </>

                        : (option === "Upload Picks" ?
                            <>
                                <span>Uploads picks for the current week from a picks csv file.</span>
                                <input type="file" name="fileInput" required />
                            </>
                            : (option === "Toggle Timer" ?
                                <>
                                    <span>Sets the timer to either paused or unpaused depending on the current state.</span>
                                </>
                                : (option === "Upload Game Results" ?
                                    <>
                                        <span>Uploads the current week games results then sets all players week stats, next weeks stats and season stats based on the result in a games csv file.</span>
                                        <input type="file" name="fileInput" required />
                                    </>
                                    : (option === "Edit Timer" ?
                                        <>
                                            <span>Sets the timers time, if empty timer is set to end 7 days from now. See <a href="https://www.npmjs.com/package/ms" target="_blank">Format</a></span>
                                            <input type="text" name="time" placeholder="Enter time" />
                                        </>
                                        : (option === "Insert User" ?
                                            <>
                                                <span>Inserts new users. Format for file uploads is: (user,password,gp,type,group_number) per line. Type is either admin or user</span>
                                                <div>
                                                    <label>from file</label>
                                                    <input type="checkbox" onClick={checkboxHandler}></input>
                                                </div>
                                                {fromFile ?
                                                    <input type="file" name="fileInput" required />
                                                    : <>
                                                        <label>Username</label>
                                                        <input type="text" name="username" placeholder="username" autoComplete="username" required />
                                                        <label>Password</label>
                                                        <input type="password" name="password" placeholder="password" autoComplete="new-password" required />
                                                        <label>User Type</label>
                                                        <input type="text" name="userType" placeholder="User Type" required />
                                                        <label>Group</label>
                                                        <input type="text" name="group" placeholder="Group" required />
                                                        <label>Group Number</label>
                                                        <input type="text" name="groupNumber" placeholder="Group Number" required />
                                                    </>
                                                }

                                            </>
                                            : (option === "Delete User" ?
                                                <>
                                                    <span>If hard delete is checked all of the users data/stats will be removed otherwise it sets user(s) as inactive. Format for file uploads is: (user,user ...).</span>
                                                    <div>
                                                        <label>from file</label>
                                                        <input type="checkbox" onClick={checkboxHandler}></input>
                                                        <label>Hard Delete</label>
                                                        <input type="checkbox" name="hardDelete" onClick={checkboxHandler}></input>
                                                    </div>
                                                    {fromFile ?
                                                        <input type="file" name="fileInput" required />
                                                        : <input type="text" name="username" placeholder="Username" autoComplete="username" required />
                                                    }

                                                </>
                                                : (option === "Set Week/Season" ?
                                                    <>
                                                        <span>Sets a week and/or season. If neither are specified the week/season will be set to the environment variables set.</span>
                                                        <label>Season Number</label>
                                                        <input type="text" name="season" placeholder="Season Number" />
                                                        <label>Week Number</label>
                                                        <input type="text" name="week" placeholder="Week Number" />
                                                    </>
                                                    : null)
                                            ))))))
                }
                <input type="submit" value={sumbitButton.text} disabled={sumbitButton.disabled} />
                <ul>
                    {formResponse?.message &&
                        (formResponse?.message.includes("<br/>") ?
                            formResponse?.message.split("<br/>").map((text, index) => (
                                text !== "" && <li key={index}><b style={{ color: "green" }}>{text}</b></li>
                            ))
                            : <li key={"0"}><b style={{ color: "green" }}>{formResponse?.message}</b></li>)
                    }
                    {formResponse?.error &&
                        (formResponse?.error.includes("<br/>") ?
                            formResponse?.error.split("<br/>").map((text, index) => (
                                text !== "" && <li key={index}><b style={{ color: "red" }}>{text}</b></li>
                            ))
                            : <li key={"0"}><b style={{ color: "red" }}>{formResponse?.error}</b></li>)
                    }
                </ul>
            </form>
        </>
    )
}