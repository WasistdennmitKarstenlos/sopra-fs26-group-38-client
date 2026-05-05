export interface FinalReportActivity {
  id: number;
  placeId: string | null;
  name: string | null;
  address: string | null;
  rating: number | null;
  rank: number;
  upvotes: number;
  downvotes: number;
  score: number;
  comments: string[];
}

export interface FinalReportWinningDestination {
  id: number;
  name: string | null;
  totalUpvotes: number;
  totalDownvotes: number;
  totalScore: number;
  activities: FinalReportActivity[];
}

export interface FinalReport {
  tripId: number;
  tripName: string | null;
  roomCode: string | null;
  generatedAt: string;
  winningDestination: FinalReportWinningDestination | null;
}