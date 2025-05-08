// src/app/_components/ProtectedContent.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedContent({
  children,
  fallback = <div className="p-8 text-center">Please sign in to view this content</div>,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === "unauthenticated") {
      // This is a client-side check
      // The middleware will handle most redirects, but this is a fallback
      // router.push("/login");
    }
  }, [status, router]);
  
  if (status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (status === "unauthenticated") {
    return fallback;
  }
  
  return <>{children}</>;
}