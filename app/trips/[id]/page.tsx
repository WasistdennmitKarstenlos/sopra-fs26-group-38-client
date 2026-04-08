"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";

export default function TripRoom() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Check if user is logged in
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
  }, [token, router]);

  // Fetch trip details
  useEffect(() => {
    if (!token || !tripId) return;

    const fetchTrip = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<Trip>(`/trips/${tripId}`);
        if (response) {
          setTrip(response);
        }
      } catch (error) {
        const err = error as Error & { status?: number };
        if (err.status === 404) {
          setFeedback({ type: "error", text: "Trip room not found." });
          router.push("/users");
        } else {
          setFeedback({ type: "error", text: "Failed to load trip. Please try again." });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [token, tripId, apiService, router]);

  const handleCopyRoomCode = useCallback(() => {
    if (trip?.roomCode) {
      navigator.clipboard.writeText(trip.roomCode);
      setFeedback({ type: "success", text: "Room code copied to clipboard!" });
    }
  }, [trip?.roomCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-label="Loading trip" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-lg font-semibold text-gray-900">Trip not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back to Dashboard
        </button>

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

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">{trip.name ?? "Trip"}</h1>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Room Code:</span> {trip.roomCode ?? "N/A"}
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="ml-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Copy
              </button>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Status:</span>{" "}
              <span className="capitalize">{trip.status?.toLowerCase() ?? "n/a"}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Created:</span>{" "}
              {trip.creationDate ? new Date(trip.creationDate).toLocaleDateString() : "N/A"}
            </p>
          </div>

          {trip.status === "ACTIVE" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white opacity-70"
              >
                Add Destination (Coming Soon)
              </button>
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 opacity-70"
              >
                Final Evaluation (Coming Soon)
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h2 className="mb-2 text-xl font-bold text-gray-900">Participants</h2>
          <p className="text-sm text-gray-600">Participant features coming soon.</p>
        </section>
      </div>
    </div>
  );
}
