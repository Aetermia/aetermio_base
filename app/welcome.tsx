"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// The page mounts when the overlay starts fading, so the reveal is a crossfade.
const REVEAL_MS = 2000;
const END_MS = 2400;

type Stage = "intro" | "reveal" | "done";

export function Welcome({
  name,
  intro,
  children,
}: {
  name: string;
  intro: boolean;
  children: React.ReactNode;
}) {
  const [stage, setStage] = useState<Stage>(intro ? "intro" : "done");
  const router = useRouter();

  useEffect(() => {
    if (!intro) return;

    const reveal = setTimeout(() => setStage("reveal"), REVEAL_MS);
    const end = setTimeout(() => {
      setStage("done");
      // Drop the query param at the end, never on mount: cleaning it early makes
      // the router re-render with no `welcome` and unmount this overlay at once.
      router.replace("/");
    }, END_MS);

    return () => {
      clearTimeout(reveal);
      clearTimeout(end);
    };
  }, [intro, router]);

  return (
    <>
      {stage === "done" ? null : (
        <div
          className={`welcome${stage === "reveal" ? " welcome--out" : ""}`}
          aria-hidden="true"
        >
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
      )}

      {stage === "intro" ? null : children}
    </>
  );
}
