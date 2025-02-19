import Login from "../components/Login"
export default function Page(): JSX.Element {
  return (
    <div className="absolute left-[50px] top-0 flex min-h-full w-[calc(100%-50px)] flex-col items-center overflow-x-hidden text-center">
      <Login />
    </div>
  )
}
