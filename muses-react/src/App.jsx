import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Highlight from "./components/Highlight/Highlight";
import News from "./components/News/News";
import Welcome from "./components/Welcome/Welcome";
import Prepare from "./components/Prepare/Prepare";
import Footer from "./components/Footer/Footer";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Highlight />
        <News />
        <Welcome />
        <Prepare />
      </main>
      <Footer />
    </>
  );
}
