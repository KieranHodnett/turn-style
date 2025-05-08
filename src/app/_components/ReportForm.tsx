// src/app/_components/ReportForm.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "../../trpc/react";
import type { Station } from "@prisma/client";

interface ReportFormProps {
  station: Station;
  onSubmitSuccess: () => void;
}

export default function ReportForm({ station, onSubmitSuccess }: ReportFormProps) {
  const { status } = useSession();
  const [content, setContent] = useState("");
  const [policePresent, setPolicePresent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createReport = api.report.create.useMutation({
    onSuccess: () => {
      setContent("");
      setPolicePresent(false);
      onSubmitSuccess();
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createReport.mutateAsync({
        stationId: station.id,
        content,
        policePresent,
      });
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status !== "authenticated") {
    return (
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Please <a href="/login" className="text-blue-500 hover:underline">sign in</a> to submit a report
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Report Details
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          placeholder="Describe what you observed at this station..."
          rows={3}
          required
        />
      </div>
      
      <div className="flex items-center">
        <input
          id="policePresent"
          type="checkbox"
          checked={policePresent}
          onChange={(e) => setPolicePresent(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="policePresent" className="ml-2 block text-sm text-gray-700">
          Police officers present
        </label>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}