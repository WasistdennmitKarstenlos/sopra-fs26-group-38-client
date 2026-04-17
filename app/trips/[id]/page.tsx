"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ActivitySearchResult } from "@/types/activity";
import { Destination } from "@/types/destination";
import { Trip } from "@/types/trip";
import { Sidebar } from "@/components/Sidebar";
import { VoteControls } from "@/components/VoteControls";
import { DestinationVoteControls } from "@/components/DestinationVoteControls";

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
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [newDestinationName, setNewDestinationName] = useState("");
  const [destinationLoading, setDestinationLoading] = useState(false);
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

  const destinationEndpoint = trip?.id && selectedDestinationId !== null
    ? `/trips/${trip.id}/destinations/${selectedDestinationId}/activities`
    : null;

  const destinationListEndpoint = trip?.id ? `/trips/${trip.id}/destinations` : null;

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
        destinationName: newDestinationName.trim(),
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

  const handleSelectActivity = useCallback((activity: ActivitySearchResult) => {
    const persistActivity = async () => {
      if (!modalDestinationId || !trip?.id) {
        setActivityFeedback({ type: "error", text: "Destination is missing." });
        return;
      }

      const endpoint = `/trips/${trip.id}/destinations/${modalDestinationId}/activities`;

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
        setDestinations((current) =>
          current.map((destination) => {
            if (destination.id !== modalDestinationId) {
              return destination;
            }
            const existingActivities = destination.activities ?? [];
            if (saved.placeId && existingActivities.some((existing) => existing.placeId === saved.placeId)) {
              return destination;
            }
            return {
              ...destination,
              activities: [saved, ...existingActivities],
            };
          }),
        );
        setActivityFeedback({ type: "success", text: `${saved.name ?? "Activity"} added to this destination.` });
        setIsActivitySearchModalOpen(false);
        setActivityQuery("");
        setActivityResults(null);
      } catch (error) {
        const err = error as Error;
        setActivityFeedback({ type: "error", text: err.message || "Could not add activity." });
      }
    };

    void persistActivity();
  }, [apiService, modalDestinationId, trip?.id]);

  const handleVoteUpdate = useCallback((updatedActivity: ActivitySearchResult) => {
    setDestinations((current) =>
      current.map((destination) => ({
        ...destination,
        activities: destination.activities?.map((activity) =>
          activity.id === updatedActivity.id ? updatedActivity : activity,
        ),
      })),
    );
  }, []);

  const handleDestinationVoteUpdate = useCallback((updatedDestination: Destination) => {
    setDestinations((current) =>
      current.map((destination) =>
        destination.id === updatedDestination.id
          ? {
            ...destination,
            upvotes: updatedDestination.upvotes,
            downvotes: updatedDestination.downvotes,
            score: updatedDestination.score,
            userVote: updatedDestination.userVote,
          }
          : destination,
      ),
    );
  }, []);

  const handleVoteError = useCallback((error: string) => {
    setFeedback({ type: "error", text: error });
  }, []);

  const handleDestinationVoteError = useCallback((error: string) => {
    setFeedback({ type: "error", text: error });
  }, []);

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

        setDestinations((current) =>
          current.map((destination) => ({
            ...destination,
            activities: destination.activities?.map((entry) =>
              entry.id === updated.id ? updated : entry,
            ),
          })),
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
        setDestinations((current) =>
          current.map((destination) => ({
            ...destination,
            activities: destination.activities?.filter((entry) => entry.id !== activity.id),
          })),
        );
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
            </div>
          )}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {destinations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-2xl font-semibold text-gray-900">Destinations</h3>
              <div className="mt-4 grid gap-4 xl:grid-cols-3 lg:grid-cols-2 sm:grid-cols-1">
                {[...destinations]
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map((destination) => (
                  <div
                    key={destination.id}
                    onClick={() => setSelectedDestinationId(destination.id)}
                    className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition ${
                      selectedDestinationId === destination.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-md"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>                        
                        <h4 className="text-xl font-bold text-gray-900">{destination.destinationName}</h4>
                      </div>
                      <DestinationVoteControls
                        tripId={trip.id ?? ""}
                        destination={destination}
                        onVoteUpdate={handleDestinationVoteUpdate}
                        onError={handleDestinationVoteError}
                      />
                    </div>
                    <div className="space-y-3">
                      {(destination.activities ?? []).length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                          No activities yet.
                        </p>
                      ) : (
                        [...(destination.activities ?? [])]
                          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                          .map((activity) => (
                          <article
                            key={activity.id ?? activity.placeId ?? `${activity.name}-${activity.address}`}
                            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start gap-4">
                              {activity.photoUrl ? (
                                <img
                                  src={activity.photoUrl}
                                  alt={activity.name ?? "Activity"}
                                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100" />
                              )}
                              <div className="min-w-0">
                                <h5 className="text-sm font-semibold text-gray-900">{activity.name ?? "Unnamed activity"}</h5>
                                <p className="mt-1 text-xs text-gray-500">{activity.address ?? "Address unavailable"}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
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
                                <div className="mt-3">
                                  <VoteControls activity={activity} onVoteUpdate={handleVoteUpdate} onError={handleVoteError} />
                                </div>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalDestinationId(destination.id);
                        setIsActivitySearchModalOpen(true);
                        setActivityQuery("");
                        setActivityResults(null);
                      }}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                    >
                      Add Event
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* Activity Search Modal */}
        {isActivitySearchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Suggest an Event to do at this Location</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsActivitySearchModalOpen(false);
                    setModalDestinationId(null);
                    setActivityQuery("");
                    setActivityResults(null);
                    setActivityFeedback(null);
                  }}
                  className="text-gray-500 transition hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={activityQuery}
                  onChange={(event) => setActivityQuery(event.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearchActivities();
                  }}
                  placeholder="Try museum, hiking, food, nightlife..."
                  className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleSearchActivities}
                  disabled={activityLoading}
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
                <div className="mt-5 grid gap-3 md:grid-cols-2">
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
                        className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 w-full"
                        disabled={activityLoading}
                      >
                        Select
                      </button>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsActivitySearchModalOpen(false);
                    setModalDestinationId(null);
                    setActivityQuery("");
                    setActivityResults(null);
                    setActivityFeedback(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
