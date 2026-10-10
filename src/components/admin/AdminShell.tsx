"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "../site/Logo";
import {
  IconChart,
  IconClose,
  IconDollar,
  IconInfo,
  IconList,
  IconLogout,
  IconMenu,
  IconMessage,
  IconPackage,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconShield,
  IconTag,
  IconTruck,
} from "../icons";

const NAV: Array<{ href: string; label: string; Icon: typeof IconList; exact?: boolean }> = [
  { href: "/admin", label: "Panel", Icon: IconList, exact: true },
  { href: "/admin/productos", label: "Productos", Icon: IconPackage },
  { href: "/admin/stock", label: "Stock", Icon: IconRefresh },
  { href: "/admin/promociones", label: "Promociones", Icon: IconTag },
  { href: "/admin/ventas", label: "Ventas", Icon: IconDollar },
  { href: "/admin/pedidos", label: "Pedidos", Icon: IconTruck },
  { href: "/admin/estadisticas", label: "Estadísticas", Icon: IconChart },
  { href: "/admin/resenas", label: "Reseñas", Icon: IconMessage },
  { href: "/admin/faq", label: "Preguntas", Icon: IconInfo },
  { href: "/admin/mides", label: "MIDES", Icon: IconShield },
  { href: "/admin/configuracion", label: "Configuración", Icon: IconSettings },
  { href: "/admin/seo", label: "SEO", Icon: IconSearch },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-600 text-white"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar escritorio */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white p-4 lg:flex lg:min-h-screen">
          <div className="px-2 py-3">
            <Logo />
          </div>
          <div className="mt-4 flex-1">{nav}</div>
          <form action={logoutAction} className="mt-4 border-t border-neutral-100 pt-4">
            <p className="truncate px-2 text-xs text-neutral-500">
              Sesión: {username}
            </p>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-red-50 hover:text-red-700"
            >
              <IconLogout size={18} /> Cerrar sesión
            </button>
          </form>
        </aside>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200"
              aria-label="Abrir menú"
            >
              <IconMenu size={20} />
            </button>
          </header>

          {open && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between px-2 py-2">
                  <Logo />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200"
                    aria-label="Cerrar menú"
                  >
                    <IconClose size={18} />
                  </button>
                </div>
                <div className="mt-4">{nav}</div>
                <form
                  action={logoutAction}
                  className="mt-4 border-t border-neutral-100 pt-4"
                >
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-red-50 hover:text-red-700"
                  >
                    <IconLogout size={18} /> Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          )}

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
