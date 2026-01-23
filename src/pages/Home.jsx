import CTA from "../sections/CTA";
import ChatBot from "../sections/ChatBot";
import Demo from "../sections/Demo";
import FAQ from "../sections/FAQ";
import Footer from "../sections/Footer";
import Header from "../sections/Header";
import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import PreProductsCTA from "../sections/PreProductsCTA";
import Products from "../sections/Products";
import Recommendations from "../sections/Recommendations";
import ReportExample from "../sections/ReportExample";
import Trust from "../sections/Trust";
import TrustMini from "../sections/TrustMini";

export default function Home() {
  return (
    <div className="page-shell">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <TrustMini />
        <ReportExample />
        <Demo />
        <ChatBot />
        <Recommendations />
        <PreProductsCTA />
        <Products />
        <Trust />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
