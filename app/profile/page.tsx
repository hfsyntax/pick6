import { getSession } from "../../lib/session"
import { getProfilePictureURL } from "../../actions/serverRequests"
import { EdgeStoreProvider } from "../../lib/edgestore"
import ProfileHandler from "../../components/ProfileHandler"
import ChangePassword from "../../components/ChangePassword"
import ProfilePictureHandler from "../../components/ProfilePictureHandler"

export const metadata = {
  title: "Pick6 - Profile",
  description: "Generated by create next app",
}

export default async function Profile(): Promise<JSX.Element> {
  const session = await getSession()
  const profilePicURL = await getProfilePictureURL()
  return (
    <div className="absolute top-0 left-[50px] w-[calc(100%-50px)] min-h-full flex flex-col text-center items-center overflow-x-hidden">
      <EdgeStoreProvider>
        <ProfilePictureHandler
          pictureURL={profilePicURL ? profilePicURL : "/default.png"}
        />
      </EdgeStoreProvider>
      <ChangePassword session={session} />
      <ProfileHandler id={session?.user?.authID} />
    </div>
  )
}
