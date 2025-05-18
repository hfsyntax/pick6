"use client"
import type { ChangeEvent } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export default function SearchBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    replace(`${pathname}?${params.toString()}`)
  }
  return (
    <input
      type="text"
      placeholder="search players"
      className="ml-1 h-[25px] w-[250px] border border-black pl-1 focus:outline-none md:ml-0"
      spellCheck={false}
      defaultValue={searchParams.get("search")?.toString()}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        handleSearch(e.target.value)
      }}
    />
  )
}
