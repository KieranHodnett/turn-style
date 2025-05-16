// src/app/_components/FavoritesList.tsx
"use client";

import { useState } from "react";
import { api } from "../../trpc/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export default function FavoritesList() {
  const { status } = useSession();
  const [expandedStationId, setExpandedStationId] = useState<string | null>(null);
  const [reportFormStationId, setReportFormStationId] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState("");
  const [policePresent, setPolicePresent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get query client for invalidation - always initialize hooks at the top level
  const queryClient = useQueryClient();
  
  // Always initialize all hooks, even if you won't use their results
  // This ensures hooks are called in the same order every render
  const { data: favorites, isLoading, refetch: refetchFavorites } = api.favorite.getAll.useQuery(undefined, {
    enabled: status === "authenticated",
    refetchOnWindowFocus: false,
  });
  
  // Always initialize mutation hooks at the top level
  const toggleFavorite = api.favorite.toggle.useMutation({
    // Don't invalidate queries on success to prevent automatic list reloading
    // onSuccess: () => {
    //   queryClient.invalidateQueries([["favorite", "getAll"]]);
    // },
  });
  
  // Add report mutation
  const createReport = api.report.create.useMutation({
    onSuccess: () => {
      // Reset form and refetch data
      setReportContent("");
      setPolicePresent(false);
      setReportFormStationId(null);
      setIsSubmitting(false);
      
      // Refetch favorites to get updated data
      void refetchFavorites();
    },
    onError: (error) => {
      console.error("Error submitting report:", error);
      setIsSubmitting(false);
    }
  });

  // Format date helper function
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handler for removing favorites - defined at the top level
  const handleRemoveFavorite = async (stationId: string, event: React.MouseEvent) => {
    try {
      // Update the star color visually
      const target = event.currentTarget as HTMLButtonElement;
      if (target) {
        // Toggle between yellow and gray without removing from list
        if (target.classList.contains('text-yellow-500')) {
          target.classList.remove('text-yellow-500');
          target.classList.add('text-gray-400');
        } else {
          target.classList.remove('text-gray-400');
          target.classList.add('text-yellow-500');
        }
      }
      
      // Still call the mutation in the background
      await toggleFavorite.mutateAsync({ stationId });
      
      // But don't refetch or update the list - it will update on next page load
      // void refetchFavorites();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };
  
  // Handler for submitting reports
  const handleSubmitReport = async (e: React.FormEvent, stationId: string) => {
    e.preventDefault();
    
    if (!reportContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await createReport.mutateAsync({
        stationId,
        content: reportContent,
        policePresent,
      });
    } catch (error) {
      console.error("Failed to submit report:", error);
      setIsSubmitting(false);
    }
  };
  
  // Toggle report form visibility
  const toggleReportForm = (stationId: string) => {
    if (reportFormStationId === stationId) {
      setReportFormStationId(null);
    } else {
      setReportFormStationId(stationId);
      setReportContent("");
      setPolicePresent(false);
    }
  };

  // Auth check - render different UI but all hooks are already initialized above
  if (status !== "authenticated") {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-center text-gray-600">
          Please sign in to view your favorite stations.
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={() => void import("next-auth/react").then(({ signIn }) => signIn("discord"))}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Sign in with Discord
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!favorites || favorites.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-center text-gray-600">
          You haven't added any favorite stations yet.
        </p>
        <div className="mt-4 text-center">
          <Link href="/map" className="text-indigo-600 hover:underline">
            Go to the map to add some favorites
          </Link>
        </div>
      </div>
    );
  }

  // Render the favorites list
  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <div key={favorite.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium">{favorite.station.name}</h2>
              <p className="text-sm text-gray-600">
                Lines: {Array.isArray(favorite.station.lines) 
                  ? favorite.station.lines.join(', ') 
                  : favorite.station.lines}
              </p>
              <p className={`text-sm font-medium ${favorite.station.policeRecent ? 'text-red-600' : 'text-gray-600'}`}>
                Police Present: {favorite.station.policeRecent ? 'Yes' : 'No'}
              </p>
            </div>
            <button 
              onClick={(e) => handleRemoveFavorite(favorite.station.id, e)}
              className="text-yellow-500 hover:text-gray-400 transition-colors"
              aria-label="Remove from favorites"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>
          
          <div className="flex space-x-2 mt-2">
            <button 
              onClick={() => setExpandedStationId(
                expandedStationId === favorite.station.id ? null : favorite.station.id
              )}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {expandedStationId === favorite.station.id ? 'Hide Reports' : 'Show Recent Reports'}
            </button>
            
            <button 
              onClick={() => toggleReportForm(favorite.station.id)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {reportFormStationId === favorite.station.id ? 'Cancel Report' : 'Submit Report'}
            </button>
          </div>
          
          {/* Report Form */}
          {reportFormStationId === favorite.station.id && (
            <div className="mt-3 border-t pt-3">
              <h3 className="text-sm font-medium mb-2">New Report</h3>
              <form onSubmit={(e) => handleSubmitReport(e, favorite.station.id)}>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Report Details</label>
                  <textarea
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows={3}
                    placeholder="Describe what you observed at this station..."
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={policePresent}
                      onChange={(e) => setPolicePresent(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Police officers present</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </div>
          )}
          
          {/* Reports Display */}
          {expandedStationId === favorite.station.id && (
            <div className="mt-3 border-t pt-3">
              <h3 className="text-sm font-medium mb-2">Recent Reports</h3>
              
              <div className="space-y-2">
                {favorite.station.reports && favorite.station.reports.length > 0 ? (
                  favorite.station.reports.map(report => (
                    <div key={report.id} className="bg-gray-50 p-2 rounded text-sm">
                      <p className="text-gray-800">{report.content}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>By: {report.user?.name || 'Anonymous'}</span>
                        <span>Police: {report.policePresent ? '✅' : '❌'}</span>
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(new Date(report.createdAt))}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent reports available</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}