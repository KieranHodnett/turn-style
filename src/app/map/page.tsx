// src/app/map/page.tsx
import MapContainer from "../_components/MapContainer";

export default function MapPage() {
  return (
    <main className="h-screen w-full flex flex-col">
      <h1 className="p-4 text-2xl font-bold">MTA Station Map</h1>
      <div className="flex-grow">
        <MapContainer />
      </div>
    </main>
  );
}