"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Proyectos", match: ["/", "/projects"] },
  { href: "/lugares", label: "Lugares", match: ["/lugares"] },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="nav-tabs" aria-label="Secciones">
      {TABS.map((tab) => {
        const on = tab.match.some(
          (base) => pathname === base || pathname.startsWith(`${base}/`),
        );

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={on ? "nav-tab on" : "nav-tab"}
            aria-current={on ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
