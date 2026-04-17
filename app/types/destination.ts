import { ActivitySearchResult } from "@/types/activity";

export interface Destination {
  id: number;
  tripId: number;
  destinationName: string;
  activities?: ActivitySearchResult[];
}