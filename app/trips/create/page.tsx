"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";

export default function CreateTrip() {
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const [loading, setLoading] = useState(false);
  const [tripName, setTripName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Check if user is logged in
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
  }, [token, router]);

  const onFinish = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFeedback(null);

      if (!token) {
        setFeedback({ type: "error", text: "Not authenticated. Please log in." });
        router.push("/login");
        return;
      }

      const normalizedTripName = tripName.trim();
      if (!normalizedTripName) {
        setFeedback({ type: "error", text: "Please enter a trip name." });
        return;
      }

      setLoading(true);
      try {
        const tripData = {
          name: normalizedTripName,
        };

        const response = await apiService.post<Trip>("/trips", tripData);

        if (response && response.id && response.roomCode) {
          setFeedback({ type: "success", text: "Trip created successfully! Redirecting..." });
          // Redirect to trip room page with room code
          router.push(`/trips/${response.roomCode}`);
        }
      } catch (error) {
        const err = error as Error & { status?: number; info?: string };
        if (err.status === 409) {
          setFeedback({ type: "error", text: "Trip name already exists. Please choose another name." });
        } else if (err.status === 400) {
          setFeedback({ type: "error", text: err.message || "Invalid request. Please check your trip data." });
        } else {
          setFeedback({ type: "error", text: err.message || "Failed to create trip. Please try again." });
        }
      } finally {
        setLoading(false);
      }
    },
    [token, tripName, apiService, router]
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Create a New Trip</h1>

        {feedback && (
          <p
            className={`mb-4 rounded-md border px-3 py-2 text-sm ${
              feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {feedback.text}
          </p>
        )}

        <form onSubmit={onFinish} autoComplete="off">
          <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="tripName">
            Trip Name
          </label>
          <input
            id="tripName"
            type="text"
            placeholder="e.g., Summer Vacation 2026"
            disabled={loading}
            maxLength={100}
            value={tripName}
            onChange={(event) => setTripName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loading ? "Creating Trip..." : "Create Trip"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/users")}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-65"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
