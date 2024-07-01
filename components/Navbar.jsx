import Link from "next/link"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getSession } from "../lib/session";
import { faIdBadge } from "@fortawesome/free-solid-svg-icons"
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
    const session = await getSession()
    return (
        <div className="navbar">
            <span id="logo">
                <Link href="/" draggable="false">
                    <Image src="/img/p6.png" width="50" height="50" priority alt="site_logo"/>
                </Link>
            </span>
            {session ?
                <>
                    <span>
                        {session?.user?.type}
                        <span>{session?.user?.username}</span>
                    </span>
                    <Link href="/profile">
                        <FontAwesomeIcon icon={faIdBadge} size="2xl" />
                    </Link>
                    
                   <LogoutButton/>
                </>
                : null
            }
        </div>
    )
}