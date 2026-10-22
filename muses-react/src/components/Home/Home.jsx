import Hero from "../../components/Hero/Hero";
import Highlight from "../../components/Highlight/Highlight";
import News from "../../components/News/News";
import Welcome from "../../components/Welcome/Welcome";
import Prepare from "../../components/Prepare/Prepare";
import ArtworkApiDemo from "../../components/ArtworkApiDemo";

export default function Home() {
  return (
    <>
      <Hero />
      <Highlight />
      <News />
      <Welcome />
      <Prepare />
      <ArtworkApiDemo /> //Thử api
    </>
  );
}