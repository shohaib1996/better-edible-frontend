import Testimonials from "@/src/components/Testimonials/Testimonials";
import AboutSection from "./AboutSection/AboutSection";
import CommitmentSection from "./Commitment/CommitmentSection";
import HeroSection from "./Hero/HeroSection";
import ProductShowcase from "./Product/ProductShowcase";
import CallToActionSection from "./CallToAction/CallToActionSection";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProductShowcase />
      <CommitmentSection />
      <Testimonials />
      <CallToActionSection />
    </>
  );
};

export default HomePage;
