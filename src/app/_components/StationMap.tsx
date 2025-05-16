// src/app/_components/StationMap.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "../../trpc/react";
import { useQueryClient } from "@tanstack/react-query"; 

// Replace with your Mapbox access token from .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Updated interface for reports
interface Report {
  id: string;
  content: string;
  createdAt: Date;
  policePresent: boolean;
  userName: string;
}

// Extended Station type to include reports
interface StationWithReports {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lines: string[] | string;
  policeRecent: boolean;
  recentReports: Report[];
  // Include other Station properties as needed
}

interface StationMapProps {
  stations: StationWithReports[];
  onReportSubmitted?: () => void; // Optional callback for when a report is submitted
}

export default function StationMap({ stations, onReportSubmitted }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationWithReports | null>(null);
  const { status } = useSession();
  
  // Add state for tracking favorited stations
  const [favoriteStations, setFavoriteStations] = useState<Set<string>>(new Set());
  
  // Get query client for invalidation
  const queryClient = useQueryClient();
  
  // Fetch user's favorites when authenticated
  const { data: favorites } = api.favorite.getAll.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (favorites) {
      // Update the set of favorite station IDs
      setFavoriteStations(new Set(favorites.map(fav => fav.stationId)));
    }
  }, [favorites]);
  
  // tRPC mutation for toggling favorites
  const toggleFavoriteMutation = api.favorite.toggle.useMutation({
    onSuccess: () => {
      // Use the query client to invalidate the getAll query
      queryClient.invalidateQueries({ queryKey: ["favorite", "getAll"] });
    }
  });
  
  // tRPC mutation for creating a report
  const createReport = api.report.create.useMutation({
    onSuccess: () => {
      // Call the callback if provided
      if (onReportSubmitted) {
        onReportSubmitted();
      }
      
      console.log("Report created successfully!");
    },
    onError: (error) => {
      console.error("Error creating report:", error);
    }
  });

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    // Try to load cached style first
    let mapStyle = 'mapbox://styles/mapbox/streets-v11';
    try {
      const cachedStyle = localStorage.getItem('mapbox_style');
      if (cachedStyle) {
        const parsedStyle = JSON.parse(cachedStyle);
        if (parsedStyle) {
          mapStyle = parsedStyle;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached map style:', e);
    }
    
    // Create the map
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-73.98, 40.75], // NYC center
      zoom: 12,
    });
    
    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl());
    
    // Save map style on load
    newMap.on('load', () => {
      try {
        const currentStyle = newMap.getStyle();
        localStorage.setItem('mapbox_style', JSON.stringify(currentStyle));
        localStorage.setItem('mapbox_style_timestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to cache map style:', e);
      }
    });
    
    // Set ref
    map.current = newMap;
    
    // Cleanup on unmount
    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Function to add legend to the map
  const addLegend = () => {
    if (!mapContainer.current) return;
    
    // Remove any existing legend first
    const existingLegend = document.getElementById('map-legend');
    if (existingLegend) {
      existingLegend.remove();
    }
    
    // Create legend
    const legendEl = document.createElement('div');
    legendEl.id = 'map-legend';
    legendEl.className = 'absolute bottom-6 right-2 p-2 bg-white bg-opacity-90 rounded shadow-md';
    legendEl.innerHTML = `
      <div class="text-sm font-medium mb-1">Legend</div>
      <div class="flex items-center mb-1">
        <div class="w-2 h-2 rounded-full mr-2 bg-red-600"></div>
        <span class="text-xs">Police Present</span>
      </div>
      <div class="flex items-center mb-1">
        <div class="w-2 h-2 rounded-full mr-2 bg-white border border-gray-400"></div>
        <span class="text-xs">No Police</span>
      </div>
      <div class="flex items-center">
        <div class="w-2 h-2 rounded-full mr-2 bg-black"></div>
        <span class="text-xs">No Recent Reports</span>
      </div>
    `;
    
    mapContainer.current.appendChild(legendEl);
  };
  
  // Function to format date in a readable way
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
  
  // Generate HTML for recent reports
  const getRecentReportsHTML = (station: StationWithReports) => {
    if (!station.recentReports || station.recentReports.length === 0) {
      return '<p class="text-gray-600 text-sm italic">No reports available</p>';
    }
    
    return `
      <div class="mt-2">
        <h4 class="font-semibold text-sm">Recent Reports:</h4>
        ${station.recentReports.map(report => `
          <div class="mt-1 p-2 bg-gray-50 rounded text-sm">
            <p class="text-gray-800">${report.content}</p>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>By: ${report.userName}</span>
              <span>Police: ${report.policePresent ? '✅' : '❌'}</span>
            </div>
            <div class="text-xs text-gray-500">${formatDate(report.createdAt)}</div>
          </div>
        `).join('')}
      </div>
    `;
  };
  
  // Get marker color based on station status
  const getMarkerColor = (station: StationWithReports) => {
    if (station.recentReports && station.recentReports.length > 0) {
      return station.policeRecent ? 'bg-red-600' : 'bg-white border border-gray-400';
    }
    return 'bg-black';
  };
  
  // Add station markers
  useEffect(() => {
    if (!map.current || !stations.length) return;
    
    // Wait for map to be fully loaded
    if (!map.current.loaded()) {
      map.current.once('load', () => {
        addMarkers();
        addLegend();
      });
    } else {
      addMarkers();
      addLegend();
    }
    
    function addMarkers() {
      // Remove existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Add new markers
      stations.forEach(station => {
        if (!station.latitude || !station.longitude) return;
        
        // Get color based on station status
        const markerColor = getMarkerColor(station);
        
        // Create marker element - a simple dot
        const el = document.createElement('div');
        el.className = `cursor-pointer w-2 h-2 rounded-full ${markerColor}`;
        
        // Create popup with report form functionality and favorite button
        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '350px' })
          .setHTML(`
            <div class="p-2">
              <div class="flex justify-between items-start">
                <h3 class="font-bold">${station.name}</h3>
                ${status === "authenticated" ? `
                <button id="favorite-btn-${station.id}" class="text-gray-400 hover:text-yellow-500 ${favoriteStations.has(station.id) ? 'text-yellow-500' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
                ` : ''}
              </div>
              <p>Lines: ${Array.isArray(station.lines) ? station.lines.join(', ') : station.lines}</p>
              <p class="font-medium ${station.policeRecent ? 'text-red-600' : 'text-gray-600'}">
                Police Present: ${station.policeRecent ? 'Yes' : 'No'}
              </p>
              
              <div id="reports-container-${station.id}" class="mt-3 border-t pt-2">
                ${getRecentReportsHTML(station)}
              </div>
              
              <div id="report-container-${station.id}" class="mt-3 border-t pt-2"></div>
            </div>
          `);
        
        // Add popup open event to setup the report functionality
        popup.on('open', () => {
          setSelectedStation(station);
          
          // Wait for popup to be fully in DOM
          setTimeout(() => {
            // Setup favorite button if user is authenticated
            if (status === "authenticated") {
              const favoriteBtn = document.getElementById(`favorite-btn-${station.id}`);
              if (favoriteBtn) {
                favoriteBtn.addEventListener('click', async () => {
                  try {
                    await toggleFavoriteMutation.mutateAsync({ stationId: station.id });
                    
                    // Update the UI immediately
                    if (favoriteStations.has(station.id)) {
                      favoriteStations.delete(station.id);
                      favoriteBtn.classList.remove('text-yellow-500');
                    } else {
                      favoriteStations.add(station.id);
                      favoriteBtn.classList.add('text-yellow-500');
                    }
                    setFavoriteStations(new Set(favoriteStations));
                    
                  } catch (error) {
                    console.error('Failed to toggle favorite:', error);
                  }
                });
              }
            }
            
            const container = document.getElementById(`report-container-${station.id}`);
            if (container) {
              // Different UI based on authentication status
              if (status === "authenticated") {
                container.innerHTML = `
                  <button id="show-report-form-${station.id}" 
                          class="mt-2 rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700">
                    Submit New Report
                  </button>
                `;
                
                // Add click handler to show the report form
                const button = document.getElementById(`show-report-form-${station.id}`);
                if (button) {
                  button.addEventListener('click', () => {
                    container.innerHTML = `
                      <form id="report-form-${station.id}" class="mt-2">
                        <div class="mb-2">
                          <label class="block text-sm font-medium text-gray-700">Report Details</label>
                          <textarea id="report-content-${station.id}"
                                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                  placeholder="Describe what you observed..."
                                  rows="3"
                                  required></textarea>
                        </div>
                        <div class="mb-2">
                          <label class="flex items-center text-sm text-gray-700">
                            <input type="checkbox" id="police-present-${station.id}" class="mr-2 h-4 w-4 rounded border-gray-300">
                            Police officers present
                          </label>
                        </div>
                        <button type="submit" 
                                class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                          Submit Report
                        </button>
                      </form>
                    `;
                    
                    // Add submit handler for the form
                    const form = document.getElementById(`report-form-${station.id}`) as HTMLFormElement;
                    form?.addEventListener('submit', async (e) => {
                      e.preventDefault();
                      
                      const contentEl = document.getElementById(`report-content-${station.id}`) as HTMLTextAreaElement;
                      const policeCheckEl = document.getElementById(`police-present-${station.id}`) as HTMLInputElement;
                      
                      if (contentEl && policeCheckEl) {
                        const content = contentEl.value;
                        const policePresent = policeCheckEl.checked;
                        
                        try {
                          // Show loading state
                          container.innerHTML = `
                            <div class="flex items-center justify-center p-4">
                              <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span class="ml-2 text-sm text-gray-700">Submitting report...</span>
                            </div>
                          `;
                          
                          // Call the tRPC mutation to save the report
                          await createReport.mutateAsync({
                            stationId: station.id,
                            content,
                            policePresent,
                          });
                          
                          // Show success message
                          container.innerHTML = `
                            <div class="rounded-md bg-green-50 p-2">
                              <p class="text-sm text-green-700">Report submitted successfully!</p>
                            </div>
                          `;
                          
                        } catch (error) {
                          console.error("Error submitting report:", error);
                          container.innerHTML = `
                            <div class="rounded-md bg-red-50 p-2">
                              <p class="text-sm text-red-700">Error submitting report. Please try again.</p>
                            </div>
                          `;
                        }
                      }
                    });
                  });
                }
              } else {
                // Login prompt for Discord
                container.innerHTML = `
                  <div class="mt-2 text-center border-t pt-2">
                    <p class="text-sm text-gray-600 mb-2">Sign in to submit a report</p>
                    <button id="login-button-${station.id}"
                           class="inline-block rounded bg-indigo-600 px-4 py-1 text-sm text-white hover:bg-indigo-700">
                      Sign in with Discord
                    </button>
                  </div>
                `;
                
                const loginButton = document.getElementById(`login-button-${station.id}`);
                if (loginButton) {
                  loginButton.addEventListener('click', () => {
                    signIn("discord", { callbackUrl: window.location.href });
                  });
                }
              }
            }
          }, 100);
        });
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        
        markers.current.push(marker);
      });
    }
  }, [stations, status, createReport, onReportSubmitted, favoriteStations, toggleFavoriteMutation]);
  
  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}