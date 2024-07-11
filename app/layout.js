import "../public/css/globals.css"
import "@fortawesome/fontawesome-svg-core/styles.css"
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getSession } from "../lib/session";

export const metadata = {
  title: "Pick6 - Login",
  description: "Generated by create next app",
};

export default async function RootLayout({ children }) {
  const session = await getSession()
  return (
    <html lang="en">
      <body>
          <Navbar />
          <div id="content">
            <Sidebar sessionType={session?.user?.type}/>
            {children}
          </div>
      </body>
    </html>
  );
}
