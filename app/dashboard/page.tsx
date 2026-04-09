"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";

export default function DashboardPage() {
  const router = useRouter();
  const { clear: clearToken } = useLocalStorage("token", "");
  const { clear: clearUserId } = useLocalStorage("userId", "");
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: currentUserId } = useLocalStorage<string>("userId", "");

  const handleLogout = () => {
    clearToken();
    clearUserId();
    router.push("/login");
  };

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
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen flex flex-col justify-between py-7 px-5 bg-[#f2f2f2] border-r border-[#ddd]">
        <div className="mb-9">
          <Image src="/logo.png" alt="TripSync logo" width={170} height={48} priority />
        </div>

        <nav className="flex flex-col gap-2.5 flex-1">
          <a className="flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] text-[#2684ff] bg-[#eef5ff] font-semibold text-base" href="#">
            <span className="w-5.5 text-center text-xl">⌂</span>
            <span>Home</span>
          </a>
          <a className="flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] text-[#555] text-base hover:bg-[#e9eefc]" href="#my-trips">
            <span className="w-5.5 text-center text-xl">✈</span>
            <span>My Trips</span>
          </a>
          <a className="flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] text-[#555] text-base hover:bg-[#e9eefc]" href="#shared-trips">
            <span className="w-5.5 text-center text-xl">🔗</span>
            <span>Shared Trips</span>
          </a>
          <button
            className="flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] text-[#555] text-base hover:bg-[#e9eefc] border-none bg-transparent cursor-pointer text-left"
            onClick={handleLogout}
          >
            <span className="w-5.5 text-center text-xl">⏻</span>
            <span>Logout</span>
          </button>
        </nav>

        <div className="flex items-center gap-3.5 pt-4.5 border-t border-[#dcdcdc]">
          <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-[#d8d8d8] to-[#bfbfbf]" />
          <div>
            <p className="m-0 text-base font-semibold">Erica</p>
            <p className="mt-1 text-sm text-[#666]">erica@gmail.com</p>
          </div>
        </div>
      </aside>

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
              onClick={() => router.push("/trips/create")}
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
