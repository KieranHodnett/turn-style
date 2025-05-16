// src/app/_components/NavBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-xl font-bold">
              MTA Tracker
            </Link>
            
            <div className="ml-10 hidden space-x-4 md:flex">
              <Link
                href="/"
                className={`rounded-md px-3 py-2 ${
                  isActive("/") ? "bg-indigo-700" : "hover:bg-indigo-500"
                }`}
              >
                Home
              </Link>
              <Link
                href="/map"
                className={`rounded-md px-3 py-2 ${
                  isActive("/map") ? "bg-indigo-700" : "hover:bg-indigo-500"
                }`}
              >
                Map
              </Link>
              {/* Add Favorites link - only show when authenticated */}
              {status === "authenticated" && (
                <Link
                  href="/favorites"
                  className={`rounded-md px-3 py-2 ${
                    isActive("/favorites") ? "bg-indigo-700" : "hover:bg-indigo-500"
                  }`}
                >
                  Favorites
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center">
              {status === "authenticated" ? (
                <div className="flex items-center space-x-4">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm">{session.user?.name}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-md bg-indigo-500 px-3 py-2 text-sm hover:bg-indigo-400"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("discord")}
                  className="rounded-md bg-white px-3 py-2 text-indigo-600 hover:bg-gray-100"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-indigo-500 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              href="/"
              className={`block rounded-md px-3 py-2 ${
                isActive("/") ? "bg-indigo-700" : "hover:bg-indigo-500"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/map"
              className={`block rounded-md px-3 py-2 ${
                isActive("/map") ? "bg-indigo-700" : "hover:bg-indigo-500"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Map
            </Link>
            
            {/* Add Favorites link to mobile menu - only show when authenticated */}
            {status === "authenticated" && (
              <Link
                href="/favorites"
                className={`block rounded-md px-3 py-2 ${
                  isActive("/favorites") ? "bg-indigo-700" : "hover:bg-indigo-500"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Favorites
              </Link>
            )}
            
            {status === "authenticated" ? (
              <div className="border-t border-indigo-500 pt-2 mt-2">
                <div className="flex items-center px-3 py-2">
                  {session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={24}
                      height={24}
                      className="rounded-full mr-2"
                    />
                  )}
                  <span className="text-sm">{session?.user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full rounded-md bg-indigo-500 px-3 py-2 text-left hover:bg-indigo-400"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signIn("discord");
                }}
                className="block w-full rounded-md bg-white px-3 py-2 text-indigo-600 hover:bg-gray-100"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}