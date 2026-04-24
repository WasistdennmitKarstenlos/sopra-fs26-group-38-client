export interface Trip {
  id: string | null;
  name: string | null;
  roomCode: string | null;
  hostId: string | null;
  creationDate: string | null;
  status: "ACTIVE" | "EVALUATION" | "FINALIZED" | null;
  finalDestinationId: string | null;
  evaluationMode?: boolean;
  finalized?: boolean;
  isHost?: boolean;
  canEnterFinalEvaluation?: boolean;
  imageBase64: string | null;
}
