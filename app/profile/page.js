import { getSession } from "../../lib/session";
import { getProfilePictureURL } from "../../actions/serverRequests";
import { EdgeStoreProvider } from "../../lib/edgestore";
import ProfileHandler from "../../components/ProfileHandler"
import ChangePassword from "../../components/ChangePassword"
import ProfilePictureHandler from "../../components/ProfilePictureHandler"

export const metadata = {
    title: "Pick6 - Profile",
    description: "Generated by create next app",
}

export default async function Profile() {
    const session = await getSession()
    const profilePicURL = await getProfilePictureURL()
    return (
        <div id="container">
            <EdgeStoreProvider>
                <ProfilePictureHandler pictureURL={profilePicURL ? profilePicURL : "/img/default.png"}/>
            </EdgeStoreProvider>
            <ChangePassword session={session}/>
            <ProfileHandler id={session?.user?.authID} />
        </div>

    )
}