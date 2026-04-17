"use client";

import { MouseEvent, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Destination } from "@/types/destination";

interface DestinationVoteControlsProps {
  tripId: number | string;
  destination: Destination;
  onVoteUpdate: (updatedDestination: Destination) => void;
}

export function DestinationVoteControls({
  tripId,
  destination,
  onVoteUpdate,
}: DestinationVoteControlsProps) {
  const apiService = useApi();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (voteType: "UP" | "DOWN", event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!destination.id || !tripId || isVoting) return;

    setIsVoting(true);
    setError(null);

    try {
      const response = await apiService.voteOnDestination(tripId, destination.id, voteType);
      onVoteUpdate({
        ...destination,
        upvotes: response.upvotes,
        downvotes: response.downvotes,
        score: response.score,
        userVote: response.userVote,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to vote";
      setError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  if (!destination.id || destination.upvotes === undefined || destination.downvotes === undefined) {
    return null;
  }

  const upvotes = destination.upvotes ?? 0;
  const downvotes = destination.downvotes ?? 0;
  const score = destination.score ?? upvotes - downvotes;
  const userVote = destination.userVote;

  return (
    <div className="flex flex-col items-end gap-2" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => handleVote("UP", event)}
          disabled={isVoting}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition ${
            userVote === "UP"
              ? "bg-green-100 text-green-700 ring-1 ring-green-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          } ${isVoting ? "cursor-not-allowed opacity-60" : ""}`}
          title="Upvote this destination"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`h-4 w-4 ${userVote === "UP" ? "text-green-600" : "text-gray-500"}`}
          >
            <path
              d="M7 14l5-5 5 5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{upvotes}</span>
        </button>

        <button
          type="button"
          onClick={(event) => handleVote("DOWN", event)}
          disabled={isVoting}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition ${
            userVote === "DOWN"
              ? "bg-red-100 text-red-700 ring-1 ring-red-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          } ${isVoting ? "cursor-not-allowed opacity-60" : ""}`}
          title="Downvote this destination"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`h-4 w-4 ${userVote === "DOWN" ? "text-red-600" : "text-gray-500"}`}
          >
            <path
              d="M17 10l-5 5-5-5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{downvotes}</span>
        </button>

        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            score > 0
              ? "bg-green-50 text-green-700"
              : score < 0
                ? "bg-red-50 text-red-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {score}
        </span>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
