import ChatBot from "../sections/ChatBot";
import CTA from "../sections/CTA";
import Demo from "../sections/Demo";
import FAQ from "../sections/FAQ";
import Footer from "../sections/Footer";
import Header from "../sections/Header";
import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import Products from "../sections/Products";
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
        <Demo />
        <ChatBot />
        <ReportExample />
        <Trust />
        <TrustMini />
        <FAQ />
        <Products />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
