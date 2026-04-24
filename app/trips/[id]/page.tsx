"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ActivitySearchResult } from "@/types/activity";
import { Destination } from "@/types/destination";
import { Trip } from "@/types/trip";
import { LocationPicker } from "@/components/LocationPicker";
import { Sidebar } from "@/components/Sidebar";
import { VoteControls } from "@/components/VoteControls";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { getApiDomain } from "@/utils/domain";

type StreamEvent = {
  event?: string;
  data: string;
};

const realtimeEndpoints = (tripId: string) => [
  `/trips/${tripId}/stream`,
  `/trips/${tripId}/destinations/stream`,
  `/trips/${tripId}/activities/stream`,
];

async function readStreamEvents(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      let eventSeparatorIndex = buffer.indexOf("\n\n");
      while (eventSeparatorIndex !== -1) {
        const rawEvent = buffer.slice(0, eventSeparatorIndex);
        buffer = buffer.slice(eventSeparatorIndex + 2);

        const lines = rawEvent.split("\n");
        let eventName: string | undefined;
        const dataLines: string[] = [];

        lines.forEach((line) => {
          if (line.startsWith(":")) {
            return;
          }

          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
            return;
          }

          if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        });

        if (dataLines.length > 0) {
          onEvent({ event: eventName, data: dataLines.join("\n") });
        }

        eventSeparatorIndex = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface TripParticipant {
  userId: number;
  username: string;
}

export default function TripRoom() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const apiService = useApi();
  const { value: token, clear: clearToken, hasRehydrated: tokenReady } = useLocalStorage<string>("token", "");
  const { value: currentUserId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const { clear: clearUsername } = useLocalStorage("username", "");
  const { value: username } = useLocalStorage<string>("username", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const { value: sidebarCollapsed, set: setSidebarCollapsed } = useLocalStorage<boolean>("sidebarCollapsed", false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [newDestinationName, setNewDestinationName] = useState("");
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [activitiesByDestination, setActivitiesByDestination] = useState<Record<number, ActivitySearchResult[]>>({});
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalDestinationId, setActivityModalDestinationId] = useState<number | null>(null);
  const [activityQuery, setActivityQuery] = useState("");
  const [activityLocation, setActivityLocation] = useState("");
  const [activityLocationCoords, setActivityLocationCoords] = useState("");
  const [activityRadius, setActivityRadius] = useState("2");
  const [activityResults, setActivityResults] = useState<ActivitySearchResult[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFeedback, setActivityFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isHost = useMemo(() => {
    if (!trip) return false;
    if (typeof trip.isHost === "boolean") return trip.isHost;
    return String(trip.hostId ?? "") === String(currentUserId ?? "");
  }, [currentUserId, trip]);

  const isEvaluationMode = Boolean(trip?.evaluationMode ?? (trip?.status === "EVALUATION"));
  const isFinalized = Boolean(trip?.finalized ?? (trip?.status === "FINALIZED"));
  const isReadOnlyMode = isEvaluationMode || isFinalized;

  const sortedDestinations = useMemo(
    () => [...destinations].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [destinations],
  );

  const winnerDestination = useMemo(() => {
    if (!trip || sortedDestinations.length === 0) return null;
    const finalId = trip.finalDestinationId ? Number(trip.finalDestinationId) : null;
    if (finalId !== null) {
      const finalMatch = sortedDestinations.find((destination) => destination.id === finalId);
      if (finalMatch) return finalMatch;
    }
    return sortedDestinations[0] ?? null;
  }, [sortedDestinations, trip]);

  const destinationExists = sortedDestinations.length > 0;
  const canStartFinalEvaluation = Boolean(
    trip && isHost && destinationExists && !isEvaluationMode && !isFinalized,
  );

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

  const fetchTrip = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!tokenReady || !token || !tripId) return;

      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await apiService.get<Trip>(`/trips/${tripId}`);
        if (response) {
          setTrip(response);
        }
      } catch (error) {
        if (silent) {
          return;
        }

        const err = error as Error & { status?: number };
        if (err.status === 404) {
          setFeedback({ type: "error", text: "Trip room not found." });
          router.push("/users");
        } else {
          setFeedback({ type: "error", text: "Failed to load trip. Please try again." });
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [apiService, router, token, tokenReady, tripId],
  );

  // Check if user is logged in (only after localStorage rehydration to avoid a false redirect)
  useEffect(() => {
    if (!tokenReady) return;
    if (!token) {
      router.push("/login");
      return;
    }
  }, [tokenReady, token, router]);

  useEffect(() => {
    void fetchTrip();
  }, [fetchTrip]);

  useEffect(() => {
    if (!tokenReady || !token || !tripId) return;

    const fetchParticipants = async () => {
      try {
        const response = await apiService.get<TripParticipant[]>(`/trips/${tripId}/participants`);
        setParticipants(response ?? []);
      } catch {
        setParticipants([]);
      }
    };

    fetchParticipants();
  }, [tokenReady, token, tripId, apiService]);

  const handleCopyRoomCode = useCallback(() => {
    if (trip?.roomCode) {
      navigator.clipboard.writeText(trip.roomCode);
      setFeedback({ type: "success", text: "Room code copied to clipboard!" });
    }
  }, [trip?.roomCode]);

  const fetchDestinations = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!destinationListEndpoint || !token) {
      setDestinations([]);
      return;
    }

    try {
      if (!silent) {
        setDestinationLoading(true);
      }

      const data = await apiService.get<Destination[]>(destinationListEndpoint);
      setDestinations(data);
      setActivitiesByDestination((current) => {
        const next: Record<number, ActivitySearchResult[]> = {};

        data.forEach((destination) => {
          next[destination.id] = current[destination.id] ?? [];
        });

        return next;
      });
    } catch {
      if (!silent) {
        setDestinations([]);
      }
    } finally {
      if (!silent) {
        setDestinationLoading(false);
      }
    }
  }, [apiService, destinationListEndpoint, token]);

  useEffect(() => {
    void fetchDestinations();
  }, [fetchDestinations]);

  useEffect(() => {
    if (!tokenReady || !token || !tripId || !destinationListEndpoint) return;

    const abortController = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    };

    const refreshFromStream = () => {
      void fetchTrip({ silent: true });
      void fetchDestinations({ silent: true });
    };

    const connect = async () => {
      while (!abortController.signal.aborted) {
        let connected = false;

        for (const endpoint of realtimeEndpoints(tripId)) {
          try {
            const response = await fetch(`${getApiDomain()}${endpoint}`, {
              method: "GET",
              headers,
              signal: abortController.signal,
              cache: "no-store",
            });

            const contentType = response.headers.get("Content-Type") ?? "";
            if (!response.ok || !response.body || !contentType.includes("text/event-stream")) {
              continue;
            }

            connected = true;
            await readStreamEvents(response.body, abortController.signal, (streamEvent) => {
              if (streamEvent.event === "trip-status-updated") {
                void fetchTrip({ silent: true });
              } else {
                refreshFromStream();
              }
            });
            break;
          } catch {
            if (abortController.signal.aborted) {
              return;
            }
          }
        }

        if (abortController.signal.aborted) {
          return;
        }

        if (!connected) {
          await new Promise<void>((resolve) => {
            reconnectTimer = setTimeout(resolve, 3000);
          });
        }
      }
    };

    void connect();

    return () => {
      abortController.abort();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [destinationListEndpoint, fetchDestinations, fetchTrip, token, tokenReady, tripId]);

  const handleAddDestination = useCallback(async () => {
    if (isReadOnlyMode) {
      setFeedback({ type: "error", text: "Trip is in read-only mode." });
      return;
    }

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
  }, [apiService, destinationListEndpoint, isReadOnlyMode, newDestinationName]);

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
      const params = new URLSearchParams({ query: activityQuery.trim() });

      const locationParam = activityLocationCoords.trim() || activityLocation.trim();
      if (locationParam) {
        params.set("location", locationParam);
      }

      if (activityRadius.trim()) {
        const radiusKm = Number(activityRadius);
        if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
          setActivityFeedback({ type: "error", text: "Radius must be a positive number." });
          setActivityLoading(false);
          return;
        }
        params.set("radius", String(Math.round(radiusKm * 1000)));
      }

      const results = await apiService.get<ActivitySearchResult[]>(
        `${endpoint}?${params.toString()}`,
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
  }, [
    activityLocation,
    activityLocationCoords,
    activityModalDestinationId,
    activityQuery,
    activityRadius,
    apiService,
    getActivitiesEndpoint,
    trip?.id,
  ]);

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
    setActivityLocation("");
    setActivityLocationCoords("");
    setActivityRadius("2");
    setActivityResults(null);
    setActivityFeedback(null);
  }, []);

  const closeActivityModal = useCallback(() => {
    setActivityModalOpen(false);
    setActivityModalDestinationId(null);
    setActivityQuery("");
    setActivityLocation("");
    setActivityLocationCoords("");
    setActivityRadius("2");
    setActivityResults(null);
    setActivityFeedback(null);
    setActivityLoading(false);
  }, []);

  const handleAddActivityToDestination = useCallback(
    async (activity: ActivitySearchResult) => {
      if (isReadOnlyMode) {
        setActivityFeedback({ type: "error", text: "Trip is in read-only mode." });
        return;
      }

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
    [activityModalDestinationId, apiService, getActivitiesEndpoint, isReadOnlyMode, token],
  );

  const handleStartFinalEvaluation = useCallback(async () => {
    if (!trip?.id || !canStartFinalEvaluation) return;

    try {
      const updatedTrip = await apiService.post<Trip>(`/trips/${trip.id}/final-evaluation`);
      setTrip(updatedTrip);
      setFeedback({ type: "success", text: "Final evaluation started. Trip is now read-only." });
      setActivityModalOpen(false);
      setActivityModalDestinationId(null);
    } catch (error) {
      const err = error as Error;
      setFeedback({ type: "error", text: err.message || "Could not start final evaluation." });
    }
  }, [apiService, canStartFinalEvaluation, trip?.id]);

  useEffect(() => {
    if (isReadOnlyMode && activityModalOpen) {
      closeActivityModal();
    }
  }, [activityModalOpen, closeActivityModal, isReadOnlyMode]);

  const handleVoteUpdate = useCallback((updatedActivity: ActivitySearchResult) => {
    if (!updatedActivity.id) return;
    setActivitiesByDestination((current) => {
      const next = { ...current };
      Object.keys(next).forEach((destinationId) => {
        const parsedDestinationId = Number(destinationId);
        next[parsedDestinationId] = (next[parsedDestinationId] ?? []).map((activity) =>
          activity.id === updatedActivity.id ? updatedActivity : activity,
        );
      });
      return next;
    });
  }, []);

  const handleVoteError = useCallback((error: string) => {
    setFeedback({ type: "error", text: error });
  }, []);

  const handleDestinationVoteError = useCallback((error: string) => {
    setFeedback({ type: "error", text: error });
  }, []);

  const participantItems = participants.length > 0
    ? participants
    : username?.trim()
      ? [{ userId: Number(currentUserId || 0), username: username.trim() }]
      : [];

  if (loading) {
    return (
      <div className={`grid h-screen overflow-hidden bg-[#f7f7f7] text-[#111] ${sidebarCollapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[270px_1fr]"}`}>
        <Sidebar onLogout={handleLogout} onCollapsedChange={setSidebarCollapsed} />
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
      <div className={`grid h-screen overflow-hidden bg-[#f7f7f7] text-[#111] ${sidebarCollapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[270px_1fr]"}`}>
        <Sidebar onLogout={handleLogout} onCollapsedChange={setSidebarCollapsed} />
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
    <div className={`grid h-screen overflow-hidden bg-[#f7f7f7] text-[#111] ${sidebarCollapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[270px_1fr]"}`}>
      <Sidebar onLogout={handleLogout} onCollapsedChange={setSidebarCollapsed} />
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
                    <span className="text-gray-500">Participants</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {participantItems.map((participant) => {
                        const isCurrentUser = String(participant.userId) === String(currentUserId);
                        return (
                          <div key={`${participant.userId}-${participant.username}`} className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                              {(participant.username?.trim()?.[0] ?? "U").toUpperCase()}
                            </span>
                            <span className="font-medium text-gray-900">{participant.username}</span>
                            {isCurrentUser && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">You</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={handleStartFinalEvaluation}
                  disabled={!canStartFinalEvaluation}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2684ff] px-4 text-sm font-semibold text-white transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Final Evaluation
                </button>
              )}
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
            <div className="flex gap-7 overflow-x-auto pb-14">
              {destinationLoading && (
                <div className="w-85 shrink-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                  <p className="text-sm text-gray-600">Loading destinations...</p>
                </div>
              )}

              {!destinationLoading && sortedDestinations
                .map((destination) => {
                const isWinner = Boolean(
                  isReadOnlyMode && winnerDestination && winnerDestination.id === destination.id,
                );
                const items = activitiesByDestination[destination.id] ?? [];
                return (
                  <div
                    key={destination.id}
                    className={`relative min-w-85 rounded-2xl bg-white p-6 transition duration-300 ${
                      isWinner
                        ? "border-2 border-blue-400 bg-blue-50/50 shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_18px_45px_-14px_rgba(37,99,235,0.65)]"
                        : "border border-gray-200 shadow-sm"
                    }`}
                  >
                    {isWinner && (
                      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                        {[...Array(12)].map((_, index) => (
                          <span
                            key={`confetti-${destination.id}-${index}`}
                            className="winner-confetti"
                            style={{
                              left: `${8 + index * 7}%`,
                              animationDelay: `${(index % 6) * 120}ms`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-3xl font-bold text-gray-900" title={destination.destinationName ?? undefined}>{destination.destinationName}</h2>
                        <p className="mt-1 text-xs text-gray-500">Live score from activity votes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isWinner && (
                          <span className="rounded-full bg-blue-200 px-3 py-1 text-sm font-semibold text-blue-900">
                            Winner
                          </span>
                        )}
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                          Score {destination.score ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-600">No events yet.</p>
                      ) : (
                        [...items]
                          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                          .map((activity) => (
                          <article
                            key={activity.id ?? activity.placeId ?? `${activity.name}-${activity.address}`}
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
                              <h3 className="truncate text-sm font-semibold text-gray-900" title={activity.name ?? undefined}>
                                {activity.name ?? "Unnamed event"}
                              </h3>
                              <div className="mt-1 flex flex-col gap-y-0.5 text-xs text-gray-600">
                                {activity.rating !== null && <span>Rating: {activity.rating}</span>}
                                {activity.address && (
                                  <span className="truncate" title={activity.address}>{activity.address}</span>
                                )}
                              </div>
                              <div className="mt-3">
                                <VoteControls
                                  activity={activity}
                                  onVoteUpdate={handleVoteUpdate}
                                  onError={handleVoteError}
                                  disabled={isReadOnlyMode}
                                />
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openActivityModal(destination.id)}
                      disabled={isReadOnlyMode}
                      className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#2684ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Add Event
                    </button>
                  </div>
                );
              })}

              <div className="w-85 shrink-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <h2 className="text-3xl font-bold text-gray-900">New Destination</h2>
                <p className="mt-2 text-sm text-gray-600">Propose a new Destination!</p>
                <div className="mt-4">
                  <input
                    type="text"
                    value={newDestinationName}
                    onChange={(event) => setNewDestinationName(event.target.value)}
                    placeholder="e.g. Rome"
                    disabled={isReadOnlyMode}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddDestination}
                    disabled={destinationLoading || isReadOnlyMode}
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

                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={activityQuery}
                    onChange={(event) => setActivityQuery(event.target.value)}
                    placeholder="Try museum, hiking, food..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                    <LocationPicker
                      value={activityLocation}
                      onChange={(display, coords) => {
                        setActivityLocation(display);
                        setActivityLocationCoords(coords);
                      }}
                      placeholder="Optional location (e.g. Zurich)"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={activityRadius}
                        onChange={(event) => setActivityRadius(event.target.value)}
                        placeholder="2"
                        className="w-full rounded-lg border border-gray-300 py-3 pl-4 pr-12 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">km</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchActivities}
                      disabled={activityLoading}
                      className="rounded-lg bg-[#2684ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activityLoading ? "Searching..." : "Search"}
                    </button>
                  </div>
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
                              disabled={isReadOnlyMode}
                              className="rounded-lg bg-[#2684ff] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-60"
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
      <style jsx>{`
        .winner-confetti {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 14px;
          border-radius: 999px;
          opacity: 0;
          animation: winner-confetti-fall 2.6s ease-in-out infinite;
          background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
        }

        .winner-confetti:nth-child(3n) {
          background: linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%);
          height: 10px;
        }

        .winner-confetti:nth-child(4n) {
          background: linear-gradient(180deg, #bfdbfe 0%, #1d4ed8 100%);
          width: 6px;
        }

        @keyframes winner-confetti-fall {
          0% {
            transform: translateY(-16px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(140px) rotate(260deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
