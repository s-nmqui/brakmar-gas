"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { CartButton } from "../cart/CartButton";
import { cn } from "@/lib/cn";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { IconChevronDown, IconClose, IconMenu, IconWhatsApp } from "../icons";
import { buttonClasses } from "../ui";

export function MainNav({
  whatsapp,
  whatsappDisplay,
  companyName,
}: {
  whatsapp: string;
  whatsappDisplay: string;
  companyName: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const primary = NAV_ITEMS.filter((i) => i.primary);
  const secondary = NAV_ITEMS.filter((i) => !i.primary);
  const waHref = buildWhatsAppUrl(
    whatsapp,
    `Hola, ${companyName}. Quiero hacer una consulta.`,
  );

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              isActive(item.href)
                ? "bg-brand-50 text-brand-700"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            {item.label}
          </Link>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              secondary.some((i) => isActive(i.href))
                ? "bg-brand-50 text-brand-700"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            Más
            <IconChevronDown
              size={16}
              className={cn("transition-transform", moreOpen && "rotate-180")}
            />
          </button>
          {moreOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
              {secondary.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-neutral-700 hover:bg-neutral-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-1.5">
        <CartButton />
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonClasses("whatsapp", "sm"),
            "hidden sm:inline-flex",
          )}
        >
          <IconWhatsApp size={18} />
          <span className="hidden xl:inline">{whatsappDisplay}</span>
          <span className="xl:hidden">WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 lg:hidden"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          <IconMenu size={24} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-neutral-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <span className="font-bold text-neutral-900">Menú</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
                aria-label="Cerrar menú"
              >
                <IconClose size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Navegación móvil">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-neutral-800 hover:bg-neutral-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-neutral-200 p-4">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonClasses("whatsapp", "lg"), "w-full")}
              >
                <IconWhatsApp size={20} />
                Escribir por WhatsApp
              </a>
              <p className="mt-2 text-center text-xs text-neutral-500">{whatsappDisplay}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
