"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { returnPathFrom, withNext } from "@/lib/auth/nextPath";

/** Link to /connexion or /inscription that remembers the current page, so sign-in brings the visitor back here. */
export function AuthLink({
  href,
  className,
  children,
}: {
  href: "/connexion" | "/inscription";
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link className={className} href={withNext(href, returnPathFrom(pathname))}>
      {children}
    </Link>
  );
}
