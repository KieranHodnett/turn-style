// src/app/_components/StationMap.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Station } from "@prisma/client";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

// Replace with your Mapbox access token from .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

interface StationMapProps {
  stations: Station[];
}

export default function StationMap({ stations }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const { status } = useSession(); // Add session hook

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
  
  // Add station markers
  useEffect(() => {
    if (!map.current || !stations.length) return;
    
    // Wait for map to be fully loaded
    if (!map.current.loaded()) {
      map.current.once('load', () => {
        addMarkers();
      });
    } else {
      addMarkers();
    }
    
    function addMarkers() {
      // Remove existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Add new markers
      stations.forEach(station => {
        if (!station.latitude || !station.longitude) return;
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" class="${station.policeRecent ? 'text-blue-600' : 'text-red-600'}">
            <path
              fill="currentColor"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
        `;
        
        // Create popup with report form functionality
        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${station.name}</h3>
              <p>Lines: ${Array.isArray(station.lines) ? station.lines.join(', ') : station.lines}</p>
              <p>Police Present: ${station.policeRecent ? 'Yes' : 'No'}</p>
              <div id="report-container-${station.id}" class="mt-2"></div>
            </div>
          `);
        
        // Add popup open event to setup the report functionality
        popup.on('open', () => {
          setSelectedStation(station);
          
          // Wait for popup to be fully in DOM
          setTimeout(() => {
            const container = document.getElementById(`report-container-${station.id}`);
            if (container) {
              // Different UI based on authentication status
              if (status === "authenticated") {
                container.innerHTML = `
                  <button id="show-report-form-${station.id}" 
                          class="mt-2 rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700">
                    Submit Report
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
                          container.innerHTML = `<p class="text-gray-600">Submitting report...</p>`;
                          
                          // Call your tRPC mutation here (you would need to implement this part)
                          // For example: 
                          // await reportMutation.mutateAsync({
                          //   stationId: station.id,
                          //   content,
                          //   policePresent,
                          // });
                          
                          // For demo purposes, we'll just show success after a delay
                          setTimeout(() => {
                            container.innerHTML = `
                              <div class="rounded-md bg-green-50 p-2">
                                <p class="text-sm text-green-700">Report submitted successfully!</p>
                              </div>
                            `;
                          }, 1000);
                          
                        } catch (error) {
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
                stations.forEach((station) => {
                  const loginButton = document.getElementById(`login-button-${station.id}`);
                  if (loginButton) {
                    loginButton.addEventListener('click', () => {
                      signIn("discord", { callbackUrl: window.location.href });
                    });
                  }
                });
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
  }, [stations, status]); // Add status to dependencies
  
  
  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}