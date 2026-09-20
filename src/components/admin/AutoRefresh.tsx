"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vuelve a pedir la página cada `every` ms mientras la pestaña está visible (para pantallas que se miran de lejos). */
export function AutoRefresh({ every = 12000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, every);
    const onVis = () => !document.hidden && router.refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router, every]);
  return null;
}
