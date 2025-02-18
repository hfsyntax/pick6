"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import { useRef, useState } from "react"
import { useEdgeStore } from "../lib/edgestore"
import Image from "next/image"
import { getProfilePictureURL } from "../actions/serverRequests"
import { updateProfilePictureURL } from "../actions/userRequests"

export default function ProfilePictureHandler({
  pictureURL,
}: {
  pictureURL: string
}): JSX.Element {
  const fileInput = useRef<HTMLInputElement>()
  const [url, setUrl] = useState(pictureURL)
  const { edgestore } = useEdgeStore()
  const [message, setMessage] = useState({ message: null, error: null })

  const handleSubmit = async () => {
    fileInput.current.click()
  }

  const handleDelete = async () => {
    try {
      const previousURL = await getProfilePictureURL()
      if (previousURL) {
        await edgestore.myPublicImage.delete({ url: previousURL })
        const defaultPictureURL = "/default.png"
        await updateProfilePictureURL("")
        setUrl(defaultPictureURL)
        setMessage({
          error: null,
          message: "Sucessfully removed profile picture",
        })
      }
    } catch (error) {
      console.error(error)
      setMessage({ message: null, error: "failed deleting profile picture" })
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        const response = await edgestore.myPublicImage.upload({ file })
        const previousURL = await getProfilePictureURL()
        if (previousURL) {
          await edgestore.myPublicImage.delete({ url: previousURL })
        }
        await updateProfilePictureURL(response.url)
        setUrl(response.url)
        setMessage({
          error: null,
          message: "Sucessfully change profile picture",
        })
      } catch (error) {
        if (error.name === "EdgeStoreApiClientError") {
          if (error.message.startsWith("File size")) {
            setMessage({
              message: null,
              error: "file size must be 0.293 mb or less",
            })
          } else if (error.message.startsWith("Only images")) {
            setMessage({
              message: null,
              error: "Only image types jpeg and png are accepted",
            })
          } else {
            setMessage({
              message: null,
              error: "Unauthorized to change profile picture",
            })
          }
        } else {
          setMessage({
            message: null,
            error: "failed changing profile picture",
          })
        }
      }
    }
  }

  return (
    <>
      <div className="relative ml-auto mr-auto w-[200px] h-[200px] group">
        <Image
          key={Date.now()}
          className="absolute top-0 left-0 h-full w-full bg-[#bbb] bg-cover rounded-[50%]"
          src={url}
          priority
          width={"200"}
          height={"200"}
          alt="profile_picture"
        />
        <FontAwesomeIcon
          className="hidden relative top-1/2 -translate-y-1/2 ml-[10px] mr-[10px] bg-gray-500 text-white cursor-pointer group-hover:inline-block"
          icon={faPenToSquare}
          size="xl"
          onClick={handleSubmit}
        />
        {!pictureURL.includes("default") && (
          <FontAwesomeIcon
            className="hidden relative top-1/2 -translate-y-1/2 ml-[10px] mr-[10px] bg-gray-500 text-white cursor-pointer group-hover:inline-block"
            icon={faTrash}
            size="xl"
            onClick={handleDelete}
          />
        )}

        <input
          ref={fileInput}
          onChange={handleFileChange}
          className="hidden"
          type="file"
        />
      </div>
      {message?.message && <b className="text-green-500">{message?.message}</b>}
      {message?.error && <b className="text-red-500">{message?.error}</b>}
    </>
  )
}
