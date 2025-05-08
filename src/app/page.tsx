// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">
        <div className="relative">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
            <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  MTA Station Tracker
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-xl">
                  Track police presence at MTA stations and submit reports in real-time.
                </p>
                <div className="mt-10 flex justify-center space-x-6">
                  <Link
                    href="/map"
                    className="rounded-md bg-white px-6 py-3 text-lg font-medium text-indigo-600 shadow-md hover:bg-gray-100"
                  >
                    View Map
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md border border-white bg-transparent px-6 py-3 text-lg font-medium text-white hover:bg-white/10"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:text-center">
                <h2 className="text-base font-semibold uppercase tracking-wide text-indigo-600">
                  Features
                </h2>
                <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
                  Everything you need to stay informed
                </p>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                  Our platform provides real-time information about MTA stations
                  and police presence.
                </p>
              </div>
              
              <div className="mt-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {/* Feature 1 */}
                  <div className="rounded-lg bg-gray-50 p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Interactive Map</h3>
                    <p className="mt-2 text-gray-600">
                      Explore all MTA stations with an interactive map interface.
                      View station details and police presence information at a glance.
                    </p>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="rounded-lg bg-gray-50 p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Real-time Reports</h3>
                    <p className="mt-2 text-gray-600">
                      Submit and view real-time reports about police presence at
                      stations. Stay informed about the latest updates.
                    </p>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="rounded-lg bg-gray-50 p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Secure Authentication</h3>
                    <p className="mt-2 text-gray-600">
                      Create an account to track your reports and contribute to
                      the community. All data is stored securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm">&copy; 2025 MTA Station Tracker. All rights reserved.</p>
            </div>
            <div className="mt-8 flex justify-center space-x-6 md:mt-0">
              <Link href="/about" className="text-gray-400 hover:text-gray-300">
                About
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-gray-300">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-gray-300">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}