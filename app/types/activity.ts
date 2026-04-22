export interface ActivitySearchResult {
  id?: number | null;
  placeId: string | null;
  name: string | null;
  address: string | null;
  rating: number | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  userVote?: "UP" | "DOWN" | null;
}