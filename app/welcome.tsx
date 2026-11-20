"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// The timing lives in globals.css; this only removes the overlay afterwards and
// cleans the URL. If hydration never runs, CSS still reveals the page.
const END_MS = 2500;

export function Welcome({
  name,
  intro,
  children,
}: {
  name: string;
  intro: boolean;
  children: React.ReactNode;
}) {
  const [done, setDone] = useState(false);
  const router = useRouter();
  const running = intro && !done;

  useEffect(() => {
    if (!intro) return;

    const timer = setTimeout(() => {
      setDone(true);
      router.replace("/");
    }, END_MS);

    return () => clearTimeout(timer);
  }, [intro, router]);

  return (
    <>
      {running ? (
        <div className="welcome" aria-hidden="true">
          <Image
            className="welcome-logo"
            src="/logo-mark.png"
            alt=""
            width={280}
            height={280}
            priority
          />
          <p className="welcome-name">Aetermio saludos, {name}</p>
        </div>
      ) : null}

      <div className={running ? "page" : undefined}>{children}</div>
    </>
  );
}
