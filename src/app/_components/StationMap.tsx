// src/app/_components/StationMap.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Station } from "@prisma/client";

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

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${station.name}</h3>
              <p>Lines: ${Array.isArray(station.lines) ? station.lines.join(', ') : station.lines}</p>
              <p>Police Present: ${station.policeRecent ? 'Yes' : 'No'}</p>
            </div>
          `);

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      });
    }
  }, [stations]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}