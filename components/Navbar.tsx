import Link from "next/link"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getSession } from "../lib/session"
import { faIdBadge } from "@fortawesome/free-solid-svg-icons"
import LogoutButton from "./LogoutButton"

export default async function Navbar(): Promise<JSX.Element> {
  const session = await getSession()
  return (
    <div className="navbar absolute top-0 left-0 h-[50px] w-full flex justify-end items-center bg-[#3181d2] text-white">
      <span className="block select-none mr-auto bg-[#0f56a6] hover:bg-[#00fff2]">
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
            className="text-inherit no-underline ml-[10px] mr-[10px]"
          >
            <FontAwesomeIcon
              icon={faIdBadge}
              size="2xl"
              className=" hover:text-gray-500 hover:cursor-pointer"
            />
          </Link>

          <LogoutButton />
        </>
      ) : (
        <Link
          href={"/"}
          className="text-inherit no-underline mr-[10px] hover:text-blue-300"
        >
          login
        </Link>
      )}
    </div>
  )
}
