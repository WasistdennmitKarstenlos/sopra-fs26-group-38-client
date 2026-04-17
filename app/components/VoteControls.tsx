"use client";

import { useState } from "react";
import { ActivitySearchResult } from "@/types/activity";
import { useApi } from "@/hooks/useApi";

interface VoteControlsProps {
  activity: ActivitySearchResult;
  onVoteUpdate: (updatedActivity: ActivitySearchResult) => void;
}

export function VoteControls({ activity, onVoteUpdate }: VoteControlsProps) {
  const apiService = useApi();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (voteType: "UP" | "DOWN") => {
    if (!activity.id || isVoting) return;

    setIsVoting(true);
    setError(null);

    try {
      const response = await apiService.voteOnActivity(activity.id, voteType);

      // Update the activity with the new vote data
      const updatedActivity: ActivitySearchResult = {
        ...activity,
        upvotes: response.upvotes,
        downvotes: response.downvotes,
        score: response.score,
        userVote: response.userVote,
      };

      onVoteUpdate(updatedActivity);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to vote";
      setError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  // Only show vote controls for activities that have been saved (have an ID)
  // and have vote data available
  if (!activity.id || activity.upvotes === undefined || activity.downvotes === undefined) {
    return null;
  }

  const upvotes = activity.upvotes ?? 0;
  const downvotes = activity.downvotes ?? 0;
  const userVote = activity.userVote;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        {/* Upvote Button */}
        <button
          type="button"
          onClick={() => handleVote("UP")}
          disabled={isVoting}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition ${
            userVote === "UP"
              ? "bg-green-100 text-green-700 ring-1 ring-green-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          } ${isVoting ? "cursor-not-allowed opacity-60" : ""}`}
          title="Upvote this activity"
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

        {/* Downvote Button */}
        <button
          type="button"
          onClick={() => handleVote("DOWN")}
          disabled={isVoting}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition ${
            userVote === "DOWN"
              ? "bg-red-100 text-red-700 ring-1 ring-red-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          } ${isVoting ? "cursor-not-allowed opacity-60" : ""}`}
          title="Downvote this activity"
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
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}