import CTA from "../sections/CTA";
import Demo from "../sections/Demo";
import Footer from "../sections/Footer";
import Header from "../sections/Header";
import Hero from "../sections/Hero";
import HowItWorks from "../sections/HowItWorks";
import Products from "../sections/Products";
import ReportExample from "../sections/ReportExample";
import TrustMini from "../sections/TrustMini";

export default function Home() {
  return (
    <div className="page-shell">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Demo />
        <ReportExample />
        <TrustMini />
        <Products />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
