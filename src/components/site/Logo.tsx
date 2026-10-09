import Image from "next/image";

export function Logo({
  logoPath,
  className,
  compact = false,
}: {
  logoPath?: string | null;
  className?: string;
  compact?: boolean;
}) {
  if (logoPath) {
    return (
      <Image
        src={logoPath}
        alt="BrakMar Gas"
        width={200}
        height={56}
        className={className ?? "h-11 w-auto"}
        priority
        unoptimized
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      role="img"
      aria-label="BrakMar Gas"
    >
      <svg
        width={compact ? 34 : 40}
        height={compact ? 34 : 40}
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="48" height="48" rx="12" fill="#d21f26" />
        <path
          d="M24 9c3.4 3.6 6 6.9 6 10.6a6 6 0 0 1-12 0C18 15.9 20.6 12.6 24 9Z"
          fill="#f58220"
        />
        <rect x="17" y="25" width="14" height="14" rx="3" fill="#ffffff" />
        <rect x="21" y="21.5" width="6" height="4" rx="1.5" fill="#ffffff" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-neutral-900">
          BrakMar<span className="text-brand-600"> Gas</span>
        </span>
        {!compact && (
          <span className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Belén · Salto
          </span>
        )}
      </span>
    </span>
  );
}
