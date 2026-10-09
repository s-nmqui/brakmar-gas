import Image from "next/image";
import { cn } from "@/lib/cn";
import { IconImage } from "../icons";

export function ProductImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const isSvg = Boolean(src && src.toLowerCase().endsWith(".svg"));
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-neutral-100",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isSvg}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-300">
          <IconImage size={44} />
          <span className="text-xs font-medium text-neutral-400">Imagen a confirmar</span>
        </div>
      )}
    </div>
  );
}
