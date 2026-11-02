import Image from "next/image";
import { Link } from "@/config/i18n";
import { Nav } from "./Nav";
import { LangSwitcher } from "./LangSwitcher";
import { HeroVideoReplayButton } from "./HeroVideoReplayButton";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="relative mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="shrink-0 rounded-lg bg-brand-navy px-3 py-2"
          aria-label="MediaCraft"
        >
          <Image
            src="/logo/logo.png"
            alt="MediaCraft"
            width={3914}
            height={1138}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <Nav className="hidden md:flex" />

        <div className="flex items-center gap-3">
          <HeroVideoReplayButton />
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
