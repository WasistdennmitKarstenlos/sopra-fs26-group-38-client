"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ActivitySearchResult } from "@/types/activity";
import { Destination } from "@/types/destination";
import { Trip } from "@/types/trip";
import { Sidebar } from "@/components/Sidebar";

export default function TripRoom() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { clear: clearToken } = useLocalStorage("token", "");
  const { clear: clearUserId } = useLocalStorage("userId", "");
  const { clear: clearUsername } = useLocalStorage("username", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [newDestinationName, setNewDestinationName] = useState("");
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  const [activityResults, setActivityResults] = useState<ActivitySearchResult[] | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<ActivitySearchResult[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFeedback, setActivityFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleLogout = useCallback(() => {
    clearToken();
    clearUserId();
    clearUsername();
    router.push("/login");
  }, [clearToken, clearUserId, clearUsername, router]);

  const destinationEndpoint = trip?.id && selectedDestinationId !== null
    ? `/trips/${trip.id}/destinations/${selectedDestinationId}/activities`
    : null;

  const destinationListEndpoint = trip?.id ? `/trips/${trip.id}/destinations` : null;

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

  const fetchDestinations = useCallback(async () => {
    if (!destinationListEndpoint || !token) {
      setDestinations([]);
      setSelectedDestinationId(null);
      return;
    }

    try {
      setDestinationLoading(true);
      const data = await apiService.get<Destination[]>(destinationListEndpoint);
      setDestinations(data);

      if (data.length === 0) {
        setSelectedDestinationId(null);
      } else {
        setSelectedDestinationId((current) => {
          if (current !== null && data.some((destination) => destination.id === current)) {
            return current;
          }
          return data[0].id;
        });
      }
    } catch {
      setDestinations([]);
      setSelectedDestinationId(null);
    } finally {
      setDestinationLoading(false);
    }
  }, [apiService, destinationListEndpoint, token]);

  useEffect(() => {
    void fetchDestinations();
  }, [fetchDestinations]);

  const handleAddDestination = useCallback(async () => {
    if (!destinationListEndpoint) {
      setFeedback({ type: "error", text: "Trip is not loaded yet." });
      return;
    }

    if (!newDestinationName.trim()) {
      setFeedback({ type: "error", text: "Destination name cannot be empty." });
      return;
    }

    try {
      const created = await apiService.post<Destination>(destinationListEndpoint, {
        name: newDestinationName.trim(),
      });
      setDestinations((current) => [created, ...current]);
      setSelectedDestinationId(created.id);
      setNewDestinationName("");
      setFeedback({ type: "success", text: "Destination added." });
    } catch (error) {
      const err = error as Error;
      setFeedback({ type: "error", text: err.message || "Could not add destination." });
    }
  }, [apiService, destinationListEndpoint, newDestinationName]);

  const handleSearchActivities = useCallback(async () => {
    if (!trip?.id || selectedDestinationId === null) {
      setActivityFeedback({
        type: "error",
        text: "Select a destination first.",
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
  }, [activityQuery, apiService, destinationEndpoint, selectedDestinationId, trip?.id]);

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

  const handleRenameActivity = useCallback((activity: ActivitySearchResult) => {
    const updateActivity = async () => {
      if (!destinationEndpoint || !activity.id) {
        setActivityFeedback({ type: "error", text: "Cannot rename this activity." });
        return;
      }

      const nextName = window.prompt("Rename activity", activity.name ?? "");
      if (!nextName || !nextName.trim()) {
        return;
      }

      try {
        const updated = await apiService.put<ActivitySearchResult>(
          `${destinationEndpoint}/${activity.id}`,
          {
            placeId: activity.placeId,
            name: nextName.trim(),
            address: activity.address,
            rating: activity.rating,
            photoUrl: activity.photoUrl,
            latitude: activity.latitude,
            longitude: activity.longitude,
          },
        );

        setSelectedActivities((current) =>
          current.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        setActivityFeedback({ type: "success", text: "Activity updated." });
      } catch (error) {
        const err = error as Error;
        setActivityFeedback({ type: "error", text: err.message || "Could not update activity." });
      }
    };

    void updateActivity();
  }, [apiService, destinationEndpoint]);

  const handleDeleteActivity = useCallback((activity: ActivitySearchResult) => {
    const deleteActivity = async () => {
      if (!destinationEndpoint || !activity.id) {
        setActivityFeedback({ type: "error", text: "Cannot delete this activity." });
        return;
      }

      try {
        await apiService.delete(`${destinationEndpoint}/${activity.id}`);
        setSelectedActivities((current) => current.filter((entry) => entry.id !== activity.id));
        setActivityFeedback({ type: "success", text: "Activity removed." });
      } catch (error) {
        const err = error as Error;
        setActivityFeedback({ type: "error", text: err.message || "Could not remove activity." });
      }
    };

    void deleteActivity();
  }, [apiService, destinationEndpoint]);

  if (loading) {
    return (
      <div className="grid h-screen grid-cols-[270px_1fr] overflow-hidden bg-[#f7f7f7] text-[#111]">
        <Sidebar onLogout={handleLogout} />
        <main className="h-screen overflow-y-auto px-14 pt-7 pb-14">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"
              aria-label="Loading trip"
            />
          </div>
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="grid h-screen grid-cols-[270px_1fr] overflow-hidden bg-[#f7f7f7] text-[#111]">
        <Sidebar onLogout={handleLogout} />
        <main className="h-screen overflow-y-auto px-14 pt-7 pb-14">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
              <p className="text-lg font-semibold text-gray-900">Trip not found</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grid h-screen grid-cols-[270px_1fr] overflow-hidden bg-[#f7f7f7] text-[#111]">
      <Sidebar onLogout={handleLogout} />
      <main className="h-screen overflow-y-auto px-14 pt-7 pb-14">
        <div className="mx-auto w-full max-w-5xl">

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

          {trip.status === "ACTIVE" && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={newDestinationName}
                  onChange={(event) => setNewDestinationName(event.target.value)}
                  placeholder="Add destination (e.g. Zurich)"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleAddDestination}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  Add Destination
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {destinationLoading && (
                  <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">Loading destinations...</span>
                )}
                {!destinationLoading && destinations.length === 0 && (
                  <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">No destinations yet.</span>
                )}
                {destinations.map((destination) => (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => setSelectedDestinationId(destination.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      selectedDestinationId === destination.id
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {destination.name}
                  </button>
                ))}
              </div>
            </div>
          )}

        <section className="rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h2 className="mb-2 text-xl font-bold text-gray-900">Participants</h2>
          <p className="text-sm text-gray-600">Participant features coming soon.</p>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h2 className="text-xl font-bold text-gray-900">Activity Search</h2>
          <p className="mt-1 text-sm text-gray-600">
            Search for activities for the selected destination.
          </p>

          {selectedDestinationId === null && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Choose a destination first, then search for activities here.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={activityQuery}
              onChange={(event) => setActivityQuery(event.target.value)}
              placeholder="Try museum, hiking, food, nightlife..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={selectedDestinationId === null}
            />
            <button
              type="button"
              onClick={handleSearchActivities}
              disabled={activityLoading || selectedDestinationId === null}
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
                        className="h-24 w-24 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-200" />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-gray-900">{activity.name ?? "Unnamed activity"}</h4>
                      <p className="mt-1 text-sm text-gray-600">{activity.address ?? "Address unavailable"}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleRenameActivity(activity)}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(activity)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      </main>
    </div>
  );
}
