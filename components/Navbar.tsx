import Link from "next/link"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getSession } from "../lib/session"
import { faIdBadge } from "@fortawesome/free-solid-svg-icons"
import LogoutButton from "./LogoutButton"

export default async function Navbar() {
  const session = await getSession()
  return (
    <div className="navbar absolute left-0 top-0 flex h-[50px] w-full items-center justify-end bg-[#3181d2] text-white">
      <span className="mr-auto block select-none bg-[#0f56a6] hover:bg-[#00fff2]">
        <Link
          href="/"
          draggable="false"
          className="text-inherit no-underline visited:text-inherit"
        >
          <Image
            src="/p6.png"
            width={50}
            height={50}
            priority
            alt="site_logo"
            className="h-[50px] w-[50px]"
          />
        </Link>
      </span>
      {session ? (
        <>
          <span className="block select-none text-[#1affff]">
            {session?.user?.type}
            <span className="block select-none text-white">
              {session?.user?.username}
            </span>
          </span>
          <Link
            href="/profile"
            className="ml-[10px] mr-[10px] text-inherit no-underline"
          >
            <FontAwesomeIcon
              icon={faIdBadge}
              size="2xl"
              className="hover:cursor-pointer hover:text-gray-500"
            />
          </Link>

          <LogoutButton />
        </>
      ) : (
        <Link
          href={"/"}
          className="mr-[10px] text-inherit no-underline hover:text-blue-300"
        >
          login
        </Link>
      )}
    </div>
  )
}
