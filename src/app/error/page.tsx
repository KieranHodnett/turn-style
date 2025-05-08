// src/app/auth/error/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <div className="bg-red-100 p-4 rounded">
        <p>Error: {error || "Unknown error"}</p>
        <p className="mt-4">
          If you're trying to sign in with an account that uses the same email address as an existing account,
          please use the original sign-in method.
        </p>
        <div className="mt-4">
          <Link href="/login" className="text-blue-500 hover:underline">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}