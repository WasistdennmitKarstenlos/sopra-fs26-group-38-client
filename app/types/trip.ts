export interface Trip {
  id: string | null;
  name: string | null;
  roomCode: string | null;
  hostId: string | null;
  creationDate: string | null;
  status: "ACTIVE" | "EVALUATION" | "FINALIZED" | null;
  finalDestinationId: string | null;
  imageBase64: string | null;
}
