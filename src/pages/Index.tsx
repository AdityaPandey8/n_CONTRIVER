import { Header, Hero, Features, HowItWorks, CTA, Footer } from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen ambient-bg">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
