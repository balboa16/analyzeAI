import CTA from "../sections/CTA";
import ChatBot from "../sections/ChatBot";
import Demo from "../sections/Demo";
import FAQ from "../sections/FAQ";
import Footer from "../sections/Footer";
import Header from "../sections/Header";
import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import Products from "../sections/Products";
import Recommendations from "../sections/Recommendations";
import Trust from "../sections/Trust";

export default function Home() {
  return (
    <div className="page-shell">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Demo />
        <ChatBot />
        <Recommendations />
        <Products />
        <Trust />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
