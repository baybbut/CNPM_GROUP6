import Hero from "../../components/Hero/Hero";
import Highlight from "../../components/Highlight/Highlight";
import News from "../../components/News/News";
import Welcome from "../../components/Welcome/Welcome";

import { HomeImagesProvider } from "../../context/HomeImagesContext";

export default function Home() {
  return (
    <HomeImagesProvider>
      <Hero />
      <Highlight />
      <News />
      <Welcome />
    </HomeImagesProvider>
  );
}
