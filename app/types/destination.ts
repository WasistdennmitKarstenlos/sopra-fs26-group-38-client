import { ActivitySearchResult } from "@/types/activity";

export interface Destination {
  id: number;
  tripId: number;
  destinationName: string;
  proposedByUserId?: number;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  userVote?: "UP" | "DOWN" | null;
  activities?: ActivitySearchResult[];
}