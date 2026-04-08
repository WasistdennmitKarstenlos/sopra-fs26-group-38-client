"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
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

  const participants = [
    { name: "Erica", color: "bg-rose-500" },
    { name: "Michael", color: "bg-emerald-500" },
    { name: "Andrew", color: "bg-sky-500" },
    { name: "Luana", color: "bg-amber-500" },
  ];

  const handleLogout = useCallback(() => {
    clearToken();
    clearUserId();
    clearUsername();
    router.push("/login");
  }, [clearToken, clearUserId, clearUsername, router]);

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

          <section className="mb-6 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="truncate text-3xl font-semibold tracking-tight text-gray-900">
                    {trip.name ?? "Trip"}
                  </h1>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>Code:</span>
                    <span className="font-medium text-gray-900">{trip.roomCode ?? "N/A"}</span>
                    <button
                      type="button"
                      onClick={handleCopyRoomCode}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label="Copy room code"
                      title="Copy"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                        <path
                          d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center text-gray-500"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path d="M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM3 16a5 5 0 0 1 10 0v1H3v-1Z" />
                        <path d="M14.5 14.5a3.5 3.5 0 0 1 2.5 3.5V19h-3v-1a6.97 6.97 0 0 0-1.02-3.6 3.48 3.48 0 0 1 1.52-.9Z" />
                        <path d="M16 7a2.5 2.5 0 0 1-2.02 2.45A4.48 4.48 0 0 0 14 8.5a4.5 4.5 0 0 0-.35-1.75A2.5 2.5 0 0 1 16 7Z" />
                      </svg>
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {participants.map((p) => (
                        <span key={p.name} className="inline-flex items-center gap-2">
                          <span
                            className={`h-6 w-6 rounded-full ${p.color} text-[11px] font-semibold text-white ring-2 ring-white`}
                            aria-hidden="true"
                          >
                            <span className="flex h-full w-full items-center justify-center">
                              {p.name[0]}
                            </span>
                          </span>
                          <span className="text-gray-800">{p.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Start Final Evaluation
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-2 text-xl font-bold text-gray-900">Participants</h2>
            <p className="text-sm text-gray-600">Participant features coming soon.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
