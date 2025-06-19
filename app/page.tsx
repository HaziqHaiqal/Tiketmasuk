import HeroSection from "@/components/HeroSection";
import FeaturedEvents from "@/components/FeaturedEvents";
import DiscoverySections from "@/components/DiscoverySections";

export default function Home() {
  return (
    <div suppressHydrationWarning className="">
      <HeroSection />
      <FeaturedEvents />
      <DiscoverySections />
    </div>
  );
}
