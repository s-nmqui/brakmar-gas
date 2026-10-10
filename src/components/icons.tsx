import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps, children: React.ReactNode, filled = false) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconWhatsApp = (p: IconProps) =>
  base(
    p,
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-3.15 4.2c-.15 0-.39.06-.6.28-.2.22-.78.76-.78 1.86 0 1.09.8 2.15.91 2.3.11.15 1.55 2.46 3.83 3.36 1.9.75 2.28.6 2.7.56.41-.04 1.33-.54 1.52-1.07.19-.53.19-.98.13-1.07-.06-.09-.2-.15-.42-.26-.22-.11-1.33-.66-1.54-.73-.2-.08-.35-.11-.5.11-.15.22-.58.73-.71.88-.13.15-.26.17-.48.06-.22-.11-.94-.35-1.79-1.1-.66-.59-1.11-1.31-1.24-1.53-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38l-.42-.01Z" />,
    true,
  );

export const IconCart = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.6L20 7H6" />
    </>,
  );

export const IconMenu = (p: IconProps) =>
  base(p, <path d="M3 6h18M3 12h18M3 18h18" />);

export const IconClose = (p: IconProps) =>
  base(p, <path d="M6 6l12 12M18 6L6 18" />);

export const IconCheck = (p: IconProps) =>
  base(p, <path d="M20 6 9 17l-5-5" />);

export const IconTruck = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M3 6.5h10.5v9H3z" />
      <path d="M13.5 9.5H18l2.5 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </>,
  );

export const IconPhone = (p: IconProps) =>
  base(
    p,
    <path d="M6.5 3.5h-2A1.5 1.5 0 0 0 3 5.1C3.3 12.9 10 19.4 18.9 20.9c.9.15 1.6-.5 1.6-1.4v-2.2c0-.7-.5-1.3-1.2-1.4l-2.6-.5c-.6-.1-1.2.1-1.5.6l-.7 1a14.6 14.6 0 0 1-6.6-6.6l1-.7c.5-.3.7-.9.6-1.5l-.5-2.6A1.4 1.4 0 0 0 8.4 3.5Z" />,
  );

export const IconClock = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 1.9" />
    </>,
  );

export const IconMapPin = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>,
  );

export const IconStar = (p: IconProps) =>
  base(
    p,
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
    true,
  );

export const IconShield = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
      <path d="M9.3 12l1.9 1.9 3.5-3.6" />
    </>,
  );

export const IconChevronDown = (p: IconProps) =>
  base(p, <path d="M6 9l6 6 6-6" />);

export const IconPlus = (p: IconProps) => base(p, <path d="M12 5v14M5 12h14" />);
export const IconMinus = (p: IconProps) => base(p, <path d="M5 12h14" />);

export const IconTrash = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>,
  );

export const IconEdit = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M13.5 6.5l4 4" />
    </>,
  );

export const IconSearch = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </>,
  );

export const IconImage = (p: IconProps) =>
  base(
    p,
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 16l-5-5L5 20" />
    </>,
  );

export const IconArrowRight = (p: IconProps) =>
  base(p, <path d="M5 12h14M13 6l6 6-6 6" />);

export const IconFlame = (p: IconProps) =>
  base(
    p,
    <path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.8-3 1.8-4.2.3 1 .8 1.7 1.6 2.2C10.4 8 12 5.5 12 3Z" />,
  );

export const IconPackage = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>,
  );

export const IconRefresh = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v5h-5" />
    </>,
  );

export const IconInfo = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>,
  );

export const IconSettings = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z" />
    </>,
  );

export const IconLogout = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
  );

export const IconList = (p: IconProps) =>
  base(p, <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />);

export const IconDollar = (p: IconProps) =>
  base(
    p,
    <path d="M12 2v20M17 5.5C16 4.6 14.2 4 12 4c-2.8 0-5 1.4-5 3.5S10 10 12 10s5 1.4 5 3.5S14.8 17 12 17c-2.2 0-4-.6-5-1.5" />,
  );

export const IconChart = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M4 20V10M10 20V4M16 20v-7" />
      <path d="M3 20h18" />
    </>,
  );

export const IconTag = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M20.6 13.4 12 22l-9-9 8.6-8.6a1 1 0 0 1 .7-.3H20a1 1 0 0 1 1 1v6.6a1 1 0 0 1-.4.7Z" />
      <circle cx="16.5" cy="7.5" r="1.2" />
    </>,
  );

export const IconMessage = (p: IconProps) =>
  base(
    p,
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 0 1 8-8h2a8 8 0 0 1 8 4Z" />,
  );

export const IconSend = (p: IconProps) =>
  base(p, <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />);

export const IconInstagram = (p: IconProps) =>
  base(
    p,
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </>,
  );

export const IconFacebook = (p: IconProps) =>
  base(
    p,
    <path d="M14 9h2.5V6H14a3.5 3.5 0 0 0-3.5 3.5V11H8.5v3H10.5v7h3v-7h2.2l.6-3h-2.8V9.8c0-.5.3-.8.5-.8Z" />,
  );

export const IconTikTok = (p: IconProps) =>
  base(
    p,
    <path d="M16 4c.4 2 1.7 3.4 3.6 3.7v2.6c-1.3 0-2.5-.4-3.6-1v5.4a5.7 5.7 0 1 1-5.7-5.7h.9v2.8h-.9a2.9 2.9 0 1 0 2.9 2.9V4z" />,
  );
