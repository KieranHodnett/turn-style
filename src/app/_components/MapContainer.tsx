// src/app/_components/MapContainer.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "../../trpc/react";
import StationMap from "./StationMap";
import type { Station } from "@prisma/client";

export default function MapContainer() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stations from API
  const { data, isLoading: isQueryLoading } = api.station.getAll.useQuery(undefined, {
    // Keep data for 24 hours
    staleTime: 1000 * 60 * 60 * 24,
    // Use cached data immediately when available
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setStations(data);
      // Cache stations in localStorage for offline use
      try {
        localStorage.setItem('mta_stations', JSON.stringify(data));
        localStorage.setItem('mta_stations_timestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to cache stations data:', e);
      }
      setIsLoading(false);
    }
  }, [data]);

  // Load cached stations if available
  useEffect(() => {
    if (!isQueryLoading) return; // Skip if API data is already loading
    
    try {
      const cachedStationsJson = localStorage.getItem('mta_stations');
      const cachedTimestamp = localStorage.getItem('mta_stations_timestamp');
      
      if (cachedStationsJson && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        const isStale = now - timestamp > 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isStale) {
          const parsedStations = JSON.parse(cachedStationsJson) as Station[];
          if (parsedStations.length > 0) {
            console.log('Using cached stations data');
            setStations(parsedStations);
            setIsLoading(false);
          }
        }
      }
    } catch (e) {
      console.error('Error loading cached stations:', e);
    }
  }, [isQueryLoading]);

  return (
    <div className="h-full w-full">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-lg">Loading stations data...</div>
        </div>
      ) : (
        <StationMap stations={stations} />
      )}
    </div>
  );
}