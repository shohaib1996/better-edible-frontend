import Footer from "@/src/components/common/Footer"
import Navbar from "@/src/components/common/Navbar"


const MainLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <div>
      <Navbar />
      <main className="">{children}</main>
      <Footer />
    </div>
  )
}

export default MainLayout
