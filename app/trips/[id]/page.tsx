"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ActivitySearchResult } from "@/types/activity";
import { Destination } from "@/types/destination";
import { Trip } from "@/types/trip";
import { Sidebar } from "@/components/Sidebar";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

export default function TripRoom() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const apiService = useApi();
  const { value: token, clear: clearToken, hasRehydrated: tokenReady } = useLocalStorage<string>("token", "");
  const { clear: clearUserId } = useLocalStorage("userId", "");
  const { clear: clearUsername } = useLocalStorage("username", "");
  const { value: username } = useLocalStorage<string>("username", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [newDestinationName, setNewDestinationName] = useState("");
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [activitiesByDestination, setActivitiesByDestination] = useState<Record<number, ActivitySearchResult[]>>({});
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalDestinationId, setActivityModalDestinationId] = useState<number | null>(null);
  const [activityQuery, setActivityQuery] = useState("");
  const [activityResults, setActivityResults] = useState<ActivitySearchResult[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFeedback, setActivityFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isActivitySearchModalOpen, setIsActivitySearchModalOpen] = useState(false);
  const [modalDestinationId, setModalDestinationId] = useState<number | null>(null);

  const handleLogout = useCallback(() => {
    clearToken();
    clearUserId();
    clearUsername();
    router.push("/login");
  }, [clearToken, clearUserId, clearUsername, router]);

  const destinationListEndpoint = trip?.id ? `/trips/${trip.id}/destinations` : null;
  const getActivitiesEndpoint = useCallback(
    (destinationId: number) => (trip?.id ? `/trips/${trip.id}/destinations/${destinationId}/activities` : null),
    [trip?.id],
  );

  // Check if user is logged in (only after localStorage rehydration to avoid a false redirect)
  useEffect(() => {
    if (!tokenReady) return;
    if (!token) {
      router.push("/login");
      return;
    }
  }, [tokenReady, token, router]);

  // Fetch trip details
  useEffect(() => {
    if (!tokenReady || !token || !tripId) return;

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
  }, [tokenReady, token, tripId, apiService, router]);

  const handleCopyRoomCode = useCallback(() => {
    if (trip?.roomCode) {
      navigator.clipboard.writeText(trip.roomCode);
      setFeedback({ type: "success", text: "Room code copied to clipboard!" });
    }
  }, [trip?.roomCode]);

  const fetchDestinations = useCallback(async () => {
    if (!destinationListEndpoint || !token) {
      setDestinations([]);
      return;
    }

    try {
      setDestinationLoading(true);
      const data = await apiService.get<Destination[]>(destinationListEndpoint);
      setDestinations(data);
    } catch {
      setDestinations([]);
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
        destinationName: newDestinationName.trim(),
      });
      setDestinations((current) => [created, ...current]);
      setActivitiesByDestination((current) => ({ ...current, [created.id]: [] }));
      setNewDestinationName("");
      setFeedback({ type: "success", text: "Destination added." });
    } catch (error) {
      const err = error as Error;
      setFeedback({ type: "error", text: err.message || "Could not add destination." });
    }
  }, [apiService, destinationListEndpoint, newDestinationName]);

  const handleSearchActivities = useCallback(async () => {
    if (!trip?.id || activityModalDestinationId === null) {
      setActivityFeedback({
        type: "error",
        text: "Pick a destination first.",
      });
      return;
    }

    if (!activityQuery.trim()) {
      setActivityFeedback({ type: "error", text: "Enter a search term first." });
      return;
    }

    const endpoint = getActivitiesEndpoint(activityModalDestinationId);
    if (!endpoint) {
      setActivityFeedback({ type: "error", text: "Trip is not loaded yet." });
      return;
    }

    try {
      setActivityLoading(true);
      setActivityFeedback(null);
      const results = await apiService.get<ActivitySearchResult[]>(
        `${endpoint}?query=${encodeURIComponent(activityQuery.trim())}`,
      );
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
  }, [activityModalDestinationId, activityQuery, apiService, getActivitiesEndpoint, trip?.id]);

  const fetchActivitiesForDestination = useCallback(
    async (destinationId: number) => {
      if (!token) return;
      const endpoint = getActivitiesEndpoint(destinationId);
      if (!endpoint) return;

      try {
        const saved = await apiService.get<ActivitySearchResult[]>(endpoint);
        setActivitiesByDestination((current) => ({ ...current, [destinationId]: saved ?? [] }));
      } catch {
        setActivitiesByDestination((current) => ({ ...current, [destinationId]: [] }));
      }
    },
    [apiService, getActivitiesEndpoint, token],
  );

  useEffect(() => {
    if (!token || destinations.length === 0) return;
    destinations.forEach((destination) => {
      void fetchActivitiesForDestination(destination.id);
    });
  }, [destinations, fetchActivitiesForDestination, token]);

  const openActivityModal = useCallback((destinationId: number) => {
    setActivityModalDestinationId(destinationId);
    setActivityModalOpen(true);
    setActivityQuery("");
    setActivityResults(null);
    setActivityFeedback(null);
  }, []);

  const closeActivityModal = useCallback(() => {
    setActivityModalOpen(false);
    setActivityModalDestinationId(null);
    setActivityQuery("");
    setActivityResults(null);
    setActivityFeedback(null);
    setActivityLoading(false);
  }, []);

  const handleAddActivityToDestination = useCallback(
    async (activity: ActivitySearchResult) => {
      if (!token || activityModalDestinationId === null) return;
      const endpoint = getActivitiesEndpoint(activityModalDestinationId);
      if (!endpoint) return;

      try {
        const saved = await apiService.post<ActivitySearchResult>(endpoint, {
          placeId: activity.placeId,
          name: activity.name,
          address: activity.address,
          rating: activity.rating,
          photoUrl: activity.photoUrl,
          latitude: activity.latitude,
          longitude: activity.longitude,
        });

        setActivitiesByDestination((current) => {
          const existing = current[activityModalDestinationId] ?? [];
          if (saved?.placeId && existing.some((entry) => entry.placeId === saved.placeId)) {
            return current;
          }
          return { ...current, [activityModalDestinationId]: [saved, ...existing] };
        });
        setActivityFeedback({ type: "success", text: `${saved.name ?? "Activity"} added.` });
      } catch (error) {
        const err = error as Error;
        setActivityFeedback({ type: "error", text: err.message || "Could not add activity." });
      }
    },
    [activityModalDestinationId, apiService, getActivitiesEndpoint, token],
  );

  if (loading) {
    return (
      <div className="grid h-screen grid-cols-[270px_1fr] overflow-hidden bg-[#f7f7f7] text-[#111]">
        <Sidebar onLogout={handleLogout} />
        <main className="h-screen overflow-y-auto px-2 pt-7 pb-14">
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
        <div className="w-full">

          <header className="mb-6 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-4xl font-bold leading-tight text-gray-900">
                    {trip.name ?? "Untitled Trip"}
                  </h1>
                  <button
                    type="button"
                    onClick={handleCopyRoomCode}
                    className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                    aria-label="Copy room code"
                    title="Copy room code"
                  >
                    <span className="text-gray-500">Code:</span>
                    <span className="font-semibold text-gray-900">{trip.roomCode ?? "—"}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-gray-700 opacity-80 transition group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3V7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 17v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3h1"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  <div className="inline-flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-500" aria-hidden="true">
                      <path
                        d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M6 11c1.66 0 3-1.34 3-3S7.66 5 6 5 3 6.34 3 8s1.34 3 3 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M6 13c-2.21 0-4 1.79-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16 13c-2.21 0-4 1.79-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 11c1.66 0 3-1.34 3-3S11.66 5 10 5 7 6.34 7 8s1.34 3 3 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {(username?.trim()?.[0] ?? "U").toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{username?.trim() || "You"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFeedback({ type: "success", text: "Final evaluation flow coming soon." })}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2684ff] px-4 text-sm font-semibold text-white transition hover:bg-[#1f6fe0]"
              >
                Start Final Evaluation
              </button>
            </div>
          </header>

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

          <section className="mt-6">
            <div className="flex gap-7 overflow-x-auto pb-4">
              {destinationLoading && (
                <div className="min-w-[340px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                  <p className="text-sm text-gray-600">Loading destinations...</p>
                </div>
              )}

              {!destinationLoading && destinations.map((destination) => {
                const items = activitiesByDestination[destination.id] ?? [];
                return (
                  <div
                    key={destination.id}
                    className="min-w-[340px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                  >
                    <h2 className="text-3xl font-bold text-gray-900">{destination.destinationName}</h2>

                    <div className="mt-5 space-y-4">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-600">No events yet.</p>
                      ) : (
                        items.map((activity) => (
                          <article
                            key={activity.placeId ?? `${activity.name}-${activity.address}`}
                            className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
                          >
                            {activity.photoUrl ? (
                              <img
                                src={activity.photoUrl}
                                alt={activity.name ?? "Event"}
                                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200" />
                            )}
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-gray-900">
                                {activity.name ?? "Unnamed event"}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                {activity.rating !== null && <span>Rating: {activity.rating}</span>}
                                {activity.address && <span className="truncate">{activity.address}</span>}
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openActivityModal(destination.id)}
                      className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#2684ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6fe0]"
                    >
                      Add Event
                    </button>
                  </div>
                );
              })}

              <div className="min-w-[340px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <h2 className="text-3xl font-bold text-gray-900">New Destination</h2>
                <p className="mt-2 text-sm text-gray-600">Propose a new Destination!</p>
                <div className="mt-4">
                  <input
                    type="text"
                    value={newDestinationName}
                    onChange={(event) => setNewDestinationName(event.target.value)}
                    placeholder="e.g. Rome"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddDestination}
                    disabled={destinationLoading}
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#2684ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add Destination
                  </button>
                </div>
              </div>
            </div>
          </section>

          <Dialog open={activityModalOpen} onClose={closeActivityModal} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
                <DialogTitle className="text-lg font-semibold text-gray-900">Add an event</DialogTitle>
                <p className="mt-1 text-sm text-gray-600">Search for an activity and add it to this destination.</p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={activityQuery}
                    onChange={(event) => setActivityQuery(event.target.value)}
                    placeholder="Try museum, hiking, food..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleSearchActivities}
                    disabled={activityLoading}
                    className="rounded-lg bg-[#2684ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-60"
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

                <div className="mt-4 max-h-[55vh] overflow-y-auto">
                  {activityResults && activityResults.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activityResults.map((activity) => (
                        <article
                          key={activity.placeId ?? `${activity.name}-${activity.address}`}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <h3 className="text-sm font-semibold text-gray-900">{activity.name ?? "Unnamed activity"}</h3>
                          <p className="mt-1 text-xs text-gray-600">{activity.address ?? "Address unavailable"}</p>
                          {activity.photoUrl && (
                            <img
                              src={activity.photoUrl}
                              alt={activity.name ?? "Activity"}
                              className="mt-3 h-28 w-full rounded-lg object-cover"
                            />
                          )}
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-600">
                              {activity.rating !== null ? <>Rating: {activity.rating}</> : <span>&nbsp;</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleAddActivityToDestination(activity)}
                              className="rounded-lg bg-[#2684ff] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fe0]"
                            >
                              Add
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Search to see suggestions.</p>
                  )}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={closeActivityModal}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
      </div>
      </main>
    </div>
  );
}
