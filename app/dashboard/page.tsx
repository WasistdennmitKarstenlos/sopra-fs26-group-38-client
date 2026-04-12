"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Trip } from "@/types/trip";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiService = useApi();

  const { clear: clearToken } = useLocalStorage("token", "");
  const { clear: clearUserId } = useLocalStorage("userId", "");
  const { value: currentUserId } = useLocalStorage<string>("userId", "");
  const { clear: clearUsername } = useLocalStorage("username", "");
  const { value: token } = useLocalStorage<string>("token", "");

  const getStoredToken = useCallback((): string => {
    try {
      const raw = globalThis.localStorage?.getItem("token");
      return raw ? (JSON.parse(raw) as string) : "";
    } catch {
      return "";
    }
  }, []);

  const [createTripOpen, setCreateTripOpen] = useState(false);
  const [tripName, setTripName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const handleLogout = () => {
    clearToken();
    clearUserId();
    clearUsername();
    router.push("/login");
  };

  const shouldOpenCreateTrip = useMemo(() => searchParams.get("createTrip") === "1", [searchParams]);

  useEffect(() => {
    if (shouldOpenCreateTrip) {
      setCreateTripOpen(true);
    }
  }, [shouldOpenCreateTrip]);

  const closeCreateTrip = useCallback(() => {
    setCreateTripOpen(false);
    setFeedback(null);
    setTripName("");
    setCreating(false);
    // Remove query param if present so refresh doesn't reopen.
    router.replace("/dashboard");
  }, [router]);

  const onCreateTrip = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFeedback(null);

      const effectiveToken = token || getStoredToken();
      if (!effectiveToken) {
        router.push("/login");
        return;
      }

      const normalizedTripName = tripName.trim();
      if (!normalizedTripName) {
        setFeedback({ type: "error", text: "Please enter a trip name." });
        return;
      }

      setCreating(true);
      try {
        const response = await apiService.post<Trip>("/trips", { name: normalizedTripName });
        if (response?.id) {
          setFeedback({ type: "success", text: "Trip created successfully! Redirecting..." });
          router.push(`/trips/${response.id}`);
          return;
        }

        setFeedback({ type: "error", text: "Trip created, but no trip id was returned." });
      } catch (error) {
        const err = error as Error & { status?: number };
        if (err.status === 409) {
          setFeedback({ type: "error", text: "Trip name already exists. Please choose another name." });
        } else if (err.status === 400) {
          setFeedback({ type: "error", text: "Invalid trip name. Please provide a valid name." });
        } else {
          setFeedback({ type: "error", text: err.message || "Failed to create trip. Please try again." });
        }
      } finally {
        setCreating(false);
      }
    },
    [apiService, getStoredToken, router, token, tripName]
  );

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
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
          setFeedback("Trip overview endpoint is not available yet on the backend.");
        } else {
          setFeedback("Failed to load trips from backend. Please try again.");
        }
      } finally {
        setLoadingTrips(false);
      }
    };

    fetchTrips();
  }, [token, apiService, router]);

  const myTrips = useMemo(
    () => trips.filter((trip) => !!trip.hostId && !!currentUserId && trip.hostId === currentUserId),
    [trips, currentUserId],
  );

  const sharedTrips = useMemo(
    () => trips.filter((trip) => !trip.hostId || !currentUserId || trip.hostId !== currentUserId),
    [trips, currentUserId],
  );

  if (!token) {
    return null;
  }

  return (
    <div className="grid grid-cols-[270px_1fr] h-screen overflow-hidden bg-[#f7f7f7] text-[#111]">
      <Sidebar onLogout={handleLogout} />

      {/* Main content */}
      <main className="h-screen overflow-y-auto px-14 pt-7 pb-14">
        <header className="flex justify-between items-center min-h-14 mb-13">
          <div />
          <div className="flex gap-3.5">
            <button className="border-none rounded-[10px] px-5 py-3 text-[15px] font-semibold cursor-pointer bg-[#2684ff] text-white" type="button">
              Join Trip
            </button>
            <button
              className="border-none rounded-[10px] px-5 py-3 text-[15px] font-semibold cursor-pointer bg-[#2684ff] text-white"
              type="button"
              onClick={() => {
                const effectiveToken = token || getStoredToken();
                if (!effectiveToken) {
                  router.push("/login");
                  return;
                }
                setCreateTripOpen(true);
              }}
            >
              Create Trip
            </button>
          </div>
        </header>

        {feedback && (
          <p className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {feedback}
          </p>
        )}

        {loadingTrips && <p className="text-sm text-[#666]">Loading trips from backend...</p>}

        {!loadingTrips && myTrips.length === 0 && sharedTrips.length === 0 ? (
        <Dialog open={createTripOpen} onClose={closeCreateTrip} className="relative z-10">
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
                  Create a New Trip
                </DialogTitle>

                {feedback && (
                  <p
                    className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                      feedback.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {feedback.text}
                  </p>
                )}

                <form onSubmit={onCreateTrip} className="mt-4" autoComplete="off">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="tripName">
                    Trip Name
                  </label>
                  <input
                    id="tripName"
                    type="text"
                    placeholder="e.g., Summer Vacation 2026"
                    disabled={creating}
                    maxLength={100}
                    value={tripName}
                    onChange={(event) => setTripName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeCreateTrip}
                      disabled={creating}
                      className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                    >
                      {creating ? "Creating…" : "Create Trip"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </Dialog>

          <section className="flex flex-col items-center justify-center h-full">
            <h1 className="text-5xl font-bold mb-2">Need a Vacation?</h1>
            <p className="text-lg text-[#666]">Create or join one with TripSync</p>
          </section>
        ) : !loadingTrips ? (
          <>
            <section id="my-trips" className="mb-14">
              <h1 className="m-0 mb-2 text-[56px] font-bold leading-tight">My Trips</h1>
              <p className="m-0 mb-7 text-lg text-[#666]">You are the owner of these trips.</p>

              <div className="grid grid-cols-4 gap-7">
                {myTrips.map((trip) => (
                  <Link key={trip.id ?? `my-${trip.roomCode ?? trip.name}`} href={`/trips/${trip.roomCode}`} className="block no-underline text-inherit cursor-pointer hover:scale-[1.02] transition-transform">
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#c9d8f0] to-[#8fb0d8] mb-3.5" />
                    <h3 className="m-0 mb-1.5 text-[22px] font-semibold">{trip.name ?? "Untitled Trip"}</h3>
                    <p className="m-0 text-sm text-[#666]">Status: {(trip.status ?? "N/A").toLowerCase()}</p>
                    <p className="m-0 text-sm text-[#666]">
                      Created: {trip.creationDate ? new Date(trip.creationDate).toLocaleDateString() : "N/A"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section id="shared-trips" className="mb-14">
              <h2 className="m-0 mb-2 text-[42px] font-bold leading-tight">Shared Trips</h2>
              <p className="m-0 mb-7 text-lg text-[#666]">You&apos;re a guest in these trips.</p>

              <div className="grid grid-cols-6 gap-6">
                {sharedTrips.map((trip) => (
                  <Link key={trip.id ?? `shared-${trip.roomCode ?? trip.name}`} href={`/trips/${trip.roomCode}`} className="block no-underline text-inherit cursor-pointer hover:scale-[1.02] transition-transform">
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#d7d7d7] to-[#bdbdbd] mb-3" />
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
      </main>
    </div>
  );
}
