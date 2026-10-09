export interface NavItem {
  href: string;
  label: string;
  primary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", primary: true },
  { href: "/productos", label: "Productos", primary: true },
  { href: "/servicios", label: "Servicios", primary: true },
  { href: "/precios", label: "Precios", primary: true },
  { href: "/promociones", label: "Promociones", primary: true },
  { href: "/mides", label: "Beneficio MIDES", primary: true },
  { href: "/contacto", label: "Contacto", primary: true },
  { href: "/nosotros", label: "Nosotros", primary: false },
  { href: "/como-comprar", label: "Cómo comprar", primary: false },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes", primary: false },
  { href: "/opiniones", label: "Opiniones", primary: false },
  { href: "/ubicacion", label: "Ubicación", primary: false },
];
