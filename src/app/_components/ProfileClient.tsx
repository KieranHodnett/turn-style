// src/app/_components/ProfileClient.tsx
"use client";

import { useSession } from "next-auth/react";
import { api } from "../../trpc/react";
import Link from "next/link";

export default function ProfileClient() {
  const { data: session, status } = useSession();
  const { data: reports, isLoading } = api.report.getByUser.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-2xl font-bold">Not Signed In</h1>
          <p className="mb-4">Please sign in to view your profile.</p>
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-3xl font-bold">Your Profile</h1>
      
      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center space-x-4">
          {session?.user?.image && (
            <img 
              src={session.user.image} 
              alt="Profile" 
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <h2 className="text-2xl font-semibold">{session?.user?.name}</h2>
            <p className="text-gray-600">{session?.user?.email}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">Your Reports</h2>
        
        {reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg bg-white p-4 shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">
                    {report.station.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mb-2">{report.text}</p>
                <div className="text-sm text-gray-600">
                  Police Present: {report.policePresent ? "Yes" : "No"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">You haven't submitted any reports yet.</p>
            <Link
              href="/map"
              className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Go to Map
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}