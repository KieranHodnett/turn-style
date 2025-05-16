// src/app/_components/MapContainer.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "../../trpc/react";
import StationMap from "./StationMap";
import type { Station } from "@prisma/client";

// Define a new type to include police presence information
interface StationWithReports extends Station {
  policeRecent: boolean;
  recentReports: {
    id: string;
    content: string;
    createdAt: Date;
    policePresent: boolean;
    userName: string; // Assuming user has a name field
  }[];
}

export default function MapContainer() {
  const [stations, setStations] = useState<StationWithReports[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stations from API
  const { data: stationsData, isLoading: isStationsLoading, refetch: refetchStations } = api.station.getAll.useQuery(undefined, {
    // Keep data for 24 hours
    staleTime: 1000 * 60 * 60 * 24,
    // Use cached data immediately when available
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch reports from API
  const { data: reportsData, isLoading: isReportsLoading, refetch: refetchReports } = api.report.getAllRecent.useQuery(undefined, {
    // Keep data for 1 hour
    staleTime: 1000 * 60 * 60,
    // Use cached data immediately when available
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (stationsData && reportsData) {
      // Process stations with reports
      const stationsWithReports = stationsData.map((station) => {
        // Get reports for this station
        const stationReports = reportsData.filter(report => report.stationId === station.id);
        
        // Sort reports by date (newest first)
        const sortedReports = stationReports.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Get the three most recent reports
        const recentReports = sortedReports.slice(0, 3).map(report => ({
          id: report.id,
          content: report.content,
          createdAt: new Date(report.createdAt),
          policePresent: report.policePresent,
          userName: report.user?.name || 'Anonymous'
        }));
        
        // Determine if police are present based on the most recent report
        const policeRecent = sortedReports[0]?.policePresent ?? false;
        
        return {
          ...station,
          policeRecent,
          recentReports
        };
      });
      
      setStations(stationsWithReports);
      
      // Cache stations in localStorage for offline use
      try {
        localStorage.setItem('mta_stations_with_reports', JSON.stringify(stationsWithReports));
        localStorage.setItem('mta_stations_timestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to cache stations data:', e);
      }
      
      setIsLoading(false);
    }
  }, [stationsData, reportsData]);

  // Load cached stations if available
  useEffect(() => {
    if (!isStationsLoading && !isReportsLoading) return; // Skip if API data is already loading
    
    try {
      const cachedStationsJson = localStorage.getItem('mta_stations_with_reports');
      const cachedTimestamp = localStorage.getItem('mta_stations_timestamp');
      
      if (cachedStationsJson && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        const isStale = now - timestamp > 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isStale) {
          const parsedStations = JSON.parse(cachedStationsJson) as StationWithReports[];
          if (parsedStations.length > 0) {
            console.log('Using cached stations with reports data');
            setStations(parsedStations);
            setIsLoading(false);
          }
        }
      }
    } catch (e) {
      console.error('Error loading cached stations:', e);
    }
  }, [isStationsLoading, isReportsLoading]);

  // Function to handle successful report submission
  const handleReportSubmitted = () => {
    console.log("Report submitted, refreshing data...");
    // Refetch both stations and reports
    void refetchStations();
    void refetchReports();
  };

  return (
    <div className="h-7/8 w-full">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-lg">Loading stations data...</div>
        </div>
      ) : (
        <StationMap 
          stations={stations} 
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </div>
  );
}