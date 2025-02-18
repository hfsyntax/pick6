import Login from "../components/Login"
export default function Page(): JSX.Element {
  return (
    <div className="absolute top-0 left-[50px] w-[calc(100%-50px)] min-h-full flex flex-col text-center items-center overflow-x-hidden">
      <Login />
    </div>
  )
}
