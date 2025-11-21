import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Navbar />
      <main className="">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
