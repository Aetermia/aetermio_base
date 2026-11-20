"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTRO_MS = 2600;

export function Welcome({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDone(true);
      // Drop the query param at the end, never on mount: cleaning it early makes
      // the router re-render with no `welcome` and unmount this overlay at once.
      router.replace("/");
    }, INTRO_MS);

    return () => clearTimeout(timer);
  }, [router]);

  if (done) return null;

  return (
    <div className="welcome" aria-hidden="true">
      <div className="welcome-wipe" />
      <div className="welcome-body">
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
    </div>
  );
}
