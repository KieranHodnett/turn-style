// src/app/favorites/page.tsx
import { Suspense } from "react";
import FavoritesList from "~/app/_components/FavoritesList";

export const metadata = {
  title: "My Favorites - Turn-Style",
  description: "Your favorite stations and their reports",
};

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Favorite Stations</h1>
      
      <Suspense fallback={<div className="animate-pulse h-40 bg-gray-200 rounded-lg"></div>}>
        <FavoritesList />
      </Suspense>
    </div>
  );
}