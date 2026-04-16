"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

interface JoinTripResponseDTO {
  tripId: number;
  roomCode: string;
  roomUsername: string;
  userId: number;
}

export default function JoinTrip() {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, hasRehydrated: tokenReady } = useLocalStorage<string>("token", "");
  const [roomCode, setRoomCode] = useState("");
  const [roomUsername, setRoomUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    if (!token) {
      router.push("/login");
    }
  }, [tokenReady, token, router]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFeedback(null);

      // Schritt 4: Client-seitige Validierung
      const normalizedCode = roomCode.trim();
      const normalizedUsername = roomUsername.trim();

      if (!normalizedCode) {
        setFeedback({ type: "error", text: "Please enter a room code." });
        return;
      }
      if (!normalizedUsername) {
        setFeedback({ type: "error", text: "Please enter your name for this trip." });
        return;
      }
      if (normalizedUsername.length > 20) {
        setFeedback({ type: "error", text: "Your name must be 20 characters or fewer." });
        return;
      }

      setLoading(true);
      try {
        // Schritt 3: API-Call — POST /trips/join mit roomCode + roomUsername im Body
        const response = await apiService.post<JoinTripResponseDTO>("/trips/join", {
          roomCode: normalizedCode,
          roomUsername: normalizedUsername,
        });

        // Schritt 6: Redirect zur Trip-Detailseite
        setFeedback({ type: "success", text: "Joined successfully! Redirecting..." });
        router.push(`/trips/${response.tripId}`);
      } catch (error) {
        // Schritt 5: Fehlerbehandlung je nach HTTP-Status
        const err = error as Error & { status?: number };
        if (err.status === 404) {
          setFeedback({ type: "error", text: "Room code not found. Please check and try again." });
        } else if (err.status === 409) {
          setFeedback({ type: "error", text: err.message ?? "Conflict: already a member or username already taken." });
        } else if (err.status === 400) {
          setFeedback({ type: "error", text: "Invalid input. Please check your entries." });
        } else {
          setFeedback({ type: "error", text: "Something went wrong. Please try again." });
        }
      } finally {
        setLoading(false);
      }
    },
    [roomCode, roomUsername, apiService, router],
  );

  if (!tokenReady || !token) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Join a Trip</h1>

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

        <form onSubmit={onSubmit} autoComplete="off">
          <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="roomCode">
            Room Code
          </label>
          <input
            id="roomCode"
            type="text"
            placeholder="e.g. ABC123"
            disabled={loading}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          <label className="mt-4 mb-1.5 block text-sm font-medium text-gray-700" htmlFor="roomUsername">
            Your name in this trip
          </label>
          <input
            id="roomUsername"
            type="text"
            placeholder="max. 20 characters"
            disabled={loading}
            maxLength={20}
            value={roomUsername}
            onChange={(e) => setRoomUsername(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loading ? "Joining..." : "Join Trip"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-65"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
