import Link from "next/link";
import { getSiteConfig } from "@/lib/settings-repo";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { IconClock, IconMapPin } from "../icons";

export function Header() {
  const config = getSiteConfig();
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="hidden border-b border-neutral-100 bg-neutral-50 md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <IconMapPin size={14} className="text-brand-600" />
            {config.locality}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock size={14} className="text-brand-600" />
            {config.schedule}
          </span>
        </div>
      </div>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${config.companyName} — Inicio`} className="shrink-0">
          <Logo logoPath={null} />
        </Link>
        <MainNav
          whatsapp={config.whatsapp}
          whatsappDisplay={config.whatsappDisplay}
          companyName={config.companyName}
        />
      </div>
    </header>
  );
}
