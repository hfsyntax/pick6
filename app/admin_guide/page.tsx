import SessionTimeout from "../../components/SessionTimeout"

export const metadata = {
  title: "Pick6 - Admin Guide",
  description: "Generated by create next app",
}

export default function AdminGuide(): JSX.Element {
  return (
    <div className="absolute left-[50px] top-0 flex h-full w-[calc(100%-50px)] flex-col items-center overflow-x-hidden">
      <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
        Admin Guide
      </h1>
      <ol className="ml-2 mt-3 w-[95%] list-inside list-decimal text-xs sm:w-[70%] sm:text-sm lg:text-base xl:text-lg">
        <li className="mb-3">
          If you would like to create new users select Insert User(s). From a
          csv/text file the format is (user,password,gp,type,group_number) per
          line.
        </li>
        <li className="mb-3">
          If you would like to delete users select Delete User(s). From a
          csv/text file the format is each user seperated by a commma. Checking
          hard delete deletes their data soft delete only prevents them from
          logging in.
        </li>
        <li className="mb-3">
          To pause/unpause the timer select the Toggle Timer option
        </li>
        <li className="mb-3">
          Before any seasons/weeks can be created select Set Week/Season option
          and enter your desired start season and week.
        </li>
        <li className="mb-3">
          To upload games ensure the timer is paused and convert the games sheet
          from histo check.xlsm to a csv file. Select Upload Games option and
          select the csv file.
        </li>
        <li className="mb-3">
          Enter the desired time to set the timer to for players to make picks
          see{" "}
          <a href="https://www.npmjs.com/package/ms" target="_blank">
            format
          </a>{" "}
          for formats and type the raw text without ms.
        </li>
        <li className="mb-3">
          To upload picks ensure the timer is unpaused and convert the picks
          sheet from histo check.xlsm to a csv file. Select Upload Picks option
          and select the csv file.
        </li>
        <li className="mb-3">
          To process the game scores and winners/losers ensure the timer is
          paused. Then convert the games sheet from histo check.xlsm to a csv
          file. Select Enter Winners option and select the csv file. The week
          number will be advanced automatically after this process.
        </li>
        <li className="mb-3">Repeat steps 6-8 each week.</li>
      </ol>
      <SessionTimeout />
    </div>
  )
}
