"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ActivitySearchResult } from "@/types/activity";
import { Trip } from "@/types/trip";

export default function TripRoom() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.id as string;
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [activityQuery, setActivityQuery] = useState("");
  const [activityResults, setActivityResults] = useState<ActivitySearchResult[] | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<ActivitySearchResult[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFeedback, setActivityFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const destinationEndpoint = trip?.id && trip.finalDestinationId
    ? `/trips/${trip.id}/destinations/${trip.finalDestinationId}/activities`
    : null;

  // Check if user is logged in
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
  }, [token, router]);

  // Fetch trip details
  useEffect(() => {
    if (!token || !roomCode) return;

    const fetchTrip = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<Trip>(`/trips/${roomCode}`);
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
  }, [token, roomCode, apiService, router]);

  const handleCopyRoomCode = useCallback(() => {
    if (trip?.roomCode) {
      navigator.clipboard.writeText(trip.roomCode);
      setFeedback({ type: "success", text: "Room code copied to clipboard!" });
    }
  }, [trip?.roomCode]);

  const handleSearchActivities = useCallback(async () => {
    if (!trip?.id || !trip.finalDestinationId) {
      setActivityFeedback({
        type: "error",
        text: "Set a final destination before searching activities.",
      });
      return;
    }

    if (!activityQuery.trim()) {
      setActivityFeedback({ type: "error", text: "Enter a search term first." });
      return;
    }

    try {
      setActivityLoading(true);
      setActivityFeedback(null);
      const endpoint = `${destinationEndpoint}?query=${encodeURIComponent(activityQuery.trim())}`;
      const results = await apiService.get<ActivitySearchResult[]>(endpoint);
      setActivityResults(results);
      setActivityFeedback(
        results.length > 0
          ? { type: "success", text: `Found ${results.length} activities.` }
          : { type: "success", text: "No activities matched that search." },
      );
    } catch (error) {
      const err = error as Error;
      setActivityFeedback({
        type: "error",
        text: err.message || "Failed to search activities.",
      });
    } finally {
      setActivityLoading(false);
    }
  }, [activityQuery, apiService, destinationEndpoint, trip?.finalDestinationId, trip?.id]);

  useEffect(() => {
    if (!destinationEndpoint || !token) {
      setSelectedActivities([]);
      return;
    }

    const fetchSavedActivities = async () => {
      try {
        const saved = await apiService.get<ActivitySearchResult[]>(destinationEndpoint);
        setSelectedActivities(saved);
      } catch {
        setSelectedActivities([]);
      }
    };

    fetchSavedActivities();
  }, [apiService, destinationEndpoint, token]);

  const handleSelectActivity = useCallback((activity: ActivitySearchResult) => {
    const persistActivity = async () => {
      if (!destinationEndpoint) {
        setActivityFeedback({ type: "error", text: "Destination is missing." });
        return;
      }

      try {
        const saved = await apiService.post<ActivitySearchResult>(destinationEndpoint, {
          placeId: activity.placeId,
          name: activity.name,
          address: activity.address,
          rating: activity.rating,
          photoUrl: activity.photoUrl,
          latitude: activity.latitude,
          longitude: activity.longitude,
        });

        setSelectedActivities((current) => {
          if (saved.placeId && current.some((existing) => existing.placeId === saved.placeId)) {
            return current;
          }
          return [saved, ...current];
        });
        setActivityFeedback({ type: "success", text: `${saved.name ?? "Activity"} added to this destination.` });
      } catch (error) {
        const err = error as Error;
        setActivityFeedback({ type: "error", text: err.message || "Could not add activity." });
      }
    };

    void persistActivity();
  }, [apiService, destinationEndpoint]);

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
          onClick={() => router.push("/users")}
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

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h2 className="text-xl font-bold text-gray-900">Activity Search</h2>
          <p className="mt-1 text-sm text-gray-600">
            Search for activities for the selected final destination.
          </p>

          {!trip.finalDestinationId && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Choose a final destination first, then search for activities here.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={activityQuery}
              onChange={(event) => setActivityQuery(event.target.value)}
              placeholder="Try museum, hiking, food, nightlife..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={!trip.finalDestinationId}
            />
            <button
              type="button"
              onClick={handleSearchActivities}
              disabled={activityLoading || !trip.finalDestinationId}
              className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activityLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {activityFeedback && (
            <p
              className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                activityFeedback.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {activityFeedback.text}
            </p>
          )}

          {activityResults && activityResults.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activityResults.map((activity) => (
                <article
                  key={activity.placeId ?? `${activity.name}-${activity.address}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200"
                >
                  <h3 className="text-base font-semibold text-gray-900">{activity.name ?? "Unnamed activity"}</h3>
                  <p className="mt-1 text-sm text-gray-600">{activity.address ?? "Address unavailable"}</p>
                  {activity.photoUrl && (
                    <img
                      src={activity.photoUrl}
                      alt={activity.name ?? "Activity"}
                      className="mt-3 h-36 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                    {activity.rating !== null && <span className="rounded-full bg-white px-2 py-1">Rating: {activity.rating}</span>}
                    {activity.latitude !== null && activity.longitude !== null && (
                      <span className="rounded-full bg-white px-2 py-1">{activity.latitude}, {activity.longitude}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectActivity(activity)}
                    className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Add to destination
                  </button>
                </article>
              ))}
            </div>
          )}

          {selectedActivities.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="text-lg font-semibold text-gray-900">Chosen activities</h3>
              <div className="mt-4 space-y-4">
                {selectedActivities.map((activity) => (
                  <article key={activity.placeId ?? `${activity.name}-${activity.address}`} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
                    {activity.photoUrl ? (
                      <img
                        src={activity.photoUrl}
                        alt={activity.name ?? "Activity"}
                        className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-gray-200" />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-gray-900">{activity.name ?? "Unnamed activity"}</h4>
                      <p className="mt-1 text-sm text-gray-600">{activity.address ?? "Address unavailable"}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
