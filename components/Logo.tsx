import Image from "next/image";
import Link from "next/link";
import logo from "@/images/tiketmasuk-logo-dark.png";

export const LOGO_CONFIG = {
  width: 224,
  height: 224,
  mobileWidth: 224,
  desktopWidth: 200,
} as const;

export function Logo() {
  return (
    <Link href="/" className="font-bold shrink-0" aria-label="Home">
      <Image
        src={logo}
        alt="TiketMasuk Logo"
        width={LOGO_CONFIG.width}
        height={LOGO_CONFIG.height}
        className="w-56 lg:w-50 object-contain"
        quality={100}
        priority
        sizes={`(max-width: 768px) ${LOGO_CONFIG.mobileWidth}px, ${LOGO_CONFIG.desktopWidth}px`}
      />
    </Link>
  );
} 