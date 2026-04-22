"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let token: unknown = "";
    try {
      const raw = globalThis.localStorage.getItem("token");
      token = raw ? JSON.parse(raw) : "";
    } catch {
      token = "";
    }

    if (typeof token === "string" && token.trim().length > 0) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [router]);

  return null;
}

