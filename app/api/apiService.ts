import { getApiDomain } from "@/utils/domain";
import { ApplicationError } from "@/types/error";
import { FinalReport } from "@/types/finalReport";

export class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private token?: string;

  constructor(token?: string) {
    this.baseURL = getApiDomain();
    this.token = token;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };
  }

  /**
   * Get headers, automatically injecting the Bearer token if one is set.
   */
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      ...(this.defaultHeaders as Record<string, string>),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

//Test commit client
  /**
   * Helper function to check the response, parse JSON,
   * and throw an error if the response is not OK.
   *
   * @param res - The response from fetch.
   * @param errorMessage - A descriptive error message for this call.
   * @returns Parsed JSON data.
   * @throws ApplicationError if res.ok is false.
   */
  private async processResponse<T>(
    res: Response,
    errorMessage: string,
  ): Promise<T> {
    if (!res.ok) {
      let errorDetail = res.statusText;
      try {
        const errorInfo = await res.json();
        if (errorInfo?.detail) {
          errorDetail = errorInfo.detail;
        } else if (errorInfo?.message) {
          errorDetail = errorInfo.message;
        } else if (errorInfo?.title) {
          errorDetail = errorInfo.title;
        } else {
          errorDetail = JSON.stringify(errorInfo);
        }
      } catch {
        // If parsing fails, keep using res.statusText
      }
      // Prefer user-facing message from API if available.
      const userMessage = errorDetail || res.statusText || "Unknown error";
      const error: ApplicationError = new Error(userMessage) as ApplicationError;
      error.info = JSON.stringify(
        { status: res.status, statusText: res.statusText },
        null,
        2,
      );
      error.status = res.status;
      throw error;
    }
    return res.headers.get("Content-Type")?.includes("application/json")
      ? (res.json() as Promise<T>)
      : Promise.resolve(res as T);
  }

  /**
   * GET request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @returns JSON data of type T.
   */
  public async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.processResponse<T>(
      res,
      "An error occurred while fetching the data.\n",
    );
  }

  /**
   * POST request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param data - The payload to post (optional).
   * @returns JSON data of type T.
   */
  public async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return this.processResponse<T>(
      res,
      "An error occurred while posting the data.\n",
    );
  }

  /**
   * PUT request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - The payload to update (optional).
   * @returns JSON data of type T.
   */
  public async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return this.processResponse<T>(
      res,
      "An error occurred while updating the data.\n",
    );
  }

  /**
   * DELETE request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @returns JSON data of type T.
   */
  public async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return this.processResponse<T>(
      res,
      "An error occurred while deleting the data.\n",
    );
  }

  /**
   * Vote on an activity.
   * @param activityId - The ID of the activity to vote on.
   * @param voteType - "UP" or "DOWN".
   * @returns Updated vote data.
   */
  public async voteOnActivity(activityId: number, voteType: "UP" | "DOWN") {
    return this.put(`/activities/${activityId}/vote`, { voteType });
  }

  /**
   * Vote on a destination.
   * @param tripId - The trip ID.
   * @param destinationId - The ID of the destination to vote on.
   * @param voteType - "UP" or "DOWN".
   * @returns Updated destination vote data.
   */
  public async voteOnDestination(
    tripId: number | string,
    destinationId: number,
    voteType: "UP" | "DOWN",
  ): Promise<{ destinationId: number; upvotes: number; downvotes: number; score: number; userVote: "UP" | "DOWN" | null }> {
    return this.put(`/trips/${tripId}/destinations/${destinationId}/vote`, { voteType });
  }

  /**
   * Fetch the compact final report for a finalized trip.
   * @param tripId - The trip ID.
   * @returns Final report payload.
   */
  public async getFinalReport(tripId: number | string): Promise<FinalReport> {
    return this.get<FinalReport>(`/trips/${tripId}/final-report`);
  }
}
