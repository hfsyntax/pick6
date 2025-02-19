import ProfileHandler from "../../../components/ProfileHandler"
import { getUser, getProfilePictureURL } from "../../../actions/serverRequests"
import Image from "next/image"

export const metadata = {
  title: "Pick6 - Profile Viewer",
  description: "Generated by create next app",
}

export default async function profileID({ params }): Promise<JSX.Element> {
  const user = await getUser(params.id)
  const profilePicURL = await getProfilePictureURL()
  return (
    <div className="absolute left-[50px] top-0 flex min-h-full w-[calc(100%-50px)] flex-col items-center overflow-x-hidden text-center">
      <div className="relative ml-auto mr-auto h-[200px] w-[200px]">
        <Image
          key={Date.now()}
          className="absolute left-0 top-0 h-full w-full rounded-[50%] bg-[#bbb] bg-cover"
          src={profilePicURL ? profilePicURL : `/default.png`}
          priority
          width={"200"}
          height={"200"}
          alt="profile_picture"
        />
      </div>
      <ProfileHandler id={params.id} />
    </div>
  )
}
