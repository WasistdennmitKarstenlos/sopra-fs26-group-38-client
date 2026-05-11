"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Trip } from "@/types/trip";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();

  const apiService = useApi();

  const { value: token, clear: clearToken, hasRehydrated: tokenReady } = useLocalStorage<string>("token", "");
  const { clear: clearUserId } = useLocalStorage("userId", "");
  const { value: currentUserId } = useLocalStorage<string>("userId", "");
  const { clear: clearUsername } = useLocalStorage("username", "");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [joinTripOpen, setJoinTripOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomUsername, setRoomUsername] = useState("");
  const [joinFeedback, setJoinFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [joining, setJoining] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const { value: sidebarCollapsed, set: setSidebarCollapsed } = useLocalStorage<boolean>("sidebarCollapsed", false);

  const getStoredToken = useCallback((): string => {
    try {
      const raw = globalThis.localStorage?.getItem("token");
      return raw ? (JSON.parse(raw) as string) : "";
    } catch {
      return "";
    }
  }, []);

  const handleLogout = () => {
    clearToken();
    clearUserId();
    clearUsername();
    router.push("/login");
  };

  const closeJoinTrip = useCallback(() => {
    setJoinTripOpen(false);
    setJoinFeedback(null);
    setRoomCode("");
    setRoomUsername("");
    setJoining(false);
  }, []);

  useEffect(() => {
    if (!tokenReady) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchTrips = async () => {
      try {
        setLoadingTrips(true);
        setFeedback(null);
        const response = await apiService.get<Trip[]>("/trips");
        setTrips(response ?? []);
      } catch (error) {
        const err = error as Error & { status?: number };
        if (err.status === 404) {
          setFeedback({
            type: "error",
            text: "Trip overview endpoint is not available yet on the backend.",
          });
        } else {
          setFeedback({
            type: "error",
            text: "Failed to load trips from backend. Please try again.",
          });
        }
      } finally {
        setLoadingTrips(false);
      }
    };

    fetchTrips();
  }, [tokenReady, token, apiService, router]);

  const onJoinTrip = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setJoinFeedback(null);

      const effectiveToken = token || getStoredToken();
      if (!effectiveToken) {
        router.push("/login");
        return;
      }

      const normalizedCode = roomCode.trim();
      if (!normalizedCode) {
        setJoinFeedback({ type: "error", text: "Please enter a room code." });
        return;
      }

      const normalizedUsername = roomUsername.trim();
      if (!normalizedUsername) {
        setJoinFeedback({ type: "error", text: "Please enter a name for this trip." });
        return;
      }
      if (normalizedUsername.length > 20) {
        setJoinFeedback({ type: "error", text: "Name must be 20 characters or fewer." });
        return;
      }

      setJoining(true);
      try {
        const response = await apiService.post<{ tripId: string }>("/trips/join", {
          roomCode: normalizedCode,
          roomUsername: normalizedUsername,
        });
        if (response?.tripId) {
          setJoinFeedback({ type: "success", text: "Joined! Redirecting..." });
          router.push(`/trips/${response.tripId}`);
          return;
        }
        setJoinFeedback({ type: "error", text: "Joined, but no trip id was returned." });
      } catch (error) {
        const err = error as Error & { status?: number };
        if (err.status === 404) {
          setJoinFeedback({ type: "error", text: "Room code not found." });
        } else if (err.status === 409) {
          setJoinFeedback({ type: "error", text: "Already a member or username already taken." });
        } else if (err.status === 400) {
          setJoinFeedback({ type: "error", text: "Invalid room code." });
        } else {
          setJoinFeedback({ type: "error", text: err.message || "Failed to join trip. Please try again." });
        }
      } finally {
        setJoining(false);
      }
    },
    [apiService, getStoredToken, roomCode, roomUsername, router, token]
  );



  const sharedTrips = useMemo(
    () => trips.filter((trip) => !trip.hostId || !currentUserId || trip.hostId !== currentUserId),
    [trips, currentUserId],
  );

  if (!tokenReady || !token) {
    return null;
  }

  return (
    <>
      <div className={`grid h-screen overflow-hidden bg-[#f7f7f7] text-[#111] ${sidebarCollapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[270px_1fr]"}`}>
        <Sidebar onLogout={handleLogout} onCollapsedChange={setSidebarCollapsed} />

      {/* Main content */}
      <main className="h-screen overflow-y-auto px-14 pt-7 pb-14">
        <header className="flex justify-between items-center min-h-14 mb-13">
          <div />
          <div className="flex gap-3.5">
            <button className="border-none rounded-[10px] px-5 py-3 text-[15px] font-semibold cursor-pointer bg-[#2684ff] text-white" type="button" onClick={() => setJoinTripOpen(true)}>
              Join Trip
            </button>
          </div>
        </header>

        {feedback && (
          <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {feedback.text}
          </p>
        )}

        {loadingTrips && <p className="text-sm text-[#666]">Loading trips from backend...</p>}

        {!loadingTrips && sharedTrips.length === 0 ? (
          <section className="flex flex-col items-center justify-center h-full">
            <h1 className="text-5xl font-bold mb-2">Join a trip using a room code</h1>
            <p className="text-lg text-[#666]">Propose cool locations and vote with your friends!</p>
          </section>
        ) : !loadingTrips ? (
          <>
            <section id="shared-trips" className="mb-14">
              <h2 className="m-0 mb-2 text-[42px] font-bold leading-tight">Shared Trips</h2>
              <p className="m-0 mb-7 text-lg text-[#666]">You&apos;re a guest in these trips.</p>

              <div className="grid grid-cols-6 gap-6">
                {sharedTrips.map((trip) => (
                  <Link key={trip.id ?? `shared-${trip.roomCode ?? trip.name}`} href={`/trips/${trip.id}`} className="block no-underline text-inherit cursor-pointer hover:scale-[1.02] transition-transform">
                    {trip.imageBase64 ? (
                      <img src={trip.imageBase64} alt={trip.name ?? "Trip cover"} className="w-full aspect-square rounded-2xl object-cover mb-3" />
                    ) : (
                      <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#d7d7d7] to-[#bdbdbd] mb-3" />
                    )}
                    <h3 className="m-0 mb-1.5 text-lg font-semibold">{trip.name ?? "Untitled Trip"}</h3>
                    <p className="m-0 text-sm text-[#666]">Status: {(trip.status ?? "N/A").toLowerCase()}</p>
                    <p className="m-0 text-sm text-[#666]">
                      Created: {trip.creationDate ? new Date(trip.creationDate).toLocaleDateString() : "N/A"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <Dialog open={joinTripOpen} onClose={closeJoinTrip} className="relative z-10">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          />

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
              >
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                  Join a Trip
                </DialogTitle>

                {joinFeedback && (
                  <p
                    className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                      joinFeedback.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {joinFeedback.text}
                  </p>
                )}

                <form onSubmit={onJoinTrip} className="mt-4" autoComplete="off">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="roomCode">
                    Room Code
                  </label>
                  <input
                    id="roomCode"
                    type="text"
                    placeholder="e.g. ABC123"
                    disabled={joining}
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                  <label className="mt-4 mb-1.5 block text-sm font-medium text-gray-700" htmlFor="roomUsername">
                    Your name in this trip
                  </label>
                  <input
                    id="roomUsername"
                    type="text"
                    placeholder="max. 20 characters"
                    disabled={joining}
                    maxLength={20}
                    value={roomUsername}
                    onChange={(event) => setRoomUsername(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeJoinTrip}
                      disabled={joining}
                      className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={joining}
                      className="inline-flex w-full justify-center rounded-md bg-[#2684ff] px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1f6fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2684ff] disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                    >
                      {joining ? "Joining…" : "Join Trip"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </main>
      </div>
    </>
  );
}
