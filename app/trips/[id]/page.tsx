"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Empty, message, Spin, Table } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";
import { User } from "@/types/user";
import styles from "@/styles/page.module.css";

export default function TripRoom() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.id as string;
  const apiService = useApi();
  const { getItem } = useLocalStorage();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<User[]>([]);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = getItem("user");
    if (!storedUser) {
      message.error("Please log in first");
      router.push("/login");
      return;
    }
    setUser(storedUser);
  }, [getItem, router]);

  // Fetch trip details
  useEffect(() => {
    if (!user || !roomCode) return;

    const fetchTrip = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<Trip>(`/trips/${roomCode}`);
        if (response) {
          setTrip(response);
        }
      } catch (error) {
        const err = error as Error & { status?: number };
        if (err.status === 404) {
          message.error("Trip room not found");
          router.push("/users");
        } else {
          message.error("Failed to load trip. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [user, roomCode, apiService, router]);

  const handleCopyRoomCode = useCallback(() => {
    if (trip?.roomCode) {
      navigator.clipboard.writeText(trip.roomCode);
      message.success("Room code copied to clipboard!");
    }
  }, [trip?.roomCode]);

  if (loading) {
    return (
      <div className={styles.center}>
        <Spin size="large" tip="Loading trip..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className={styles.center}>
        <Empty description="Trip not found" />
      </div>
    );
  }

  const isHost = user?.id === trip.hostId;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Button onClick={() => router.push("/users")} style={{ marginBottom: 16 }}>
        ← Back to Dashboard
      </Button>

      <Card title={trip.name} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <p>
            <strong>Room Code:</strong> {trip.roomCode}
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={handleCopyRoomCode}
              style={{ marginLeft: 8 }}
            >
              Copy
            </Button>
          </p>
          <p>
            <strong>Status:</strong> 
            <span style={{ marginLeft: 8, textTransform: "capitalize" }}>
              {trip.status?.toLowerCase()}
            </span>
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {trip.creationDate
              ? new Date(trip.creationDate).toLocaleDateString()
              : "N/A"}
          </p>
          {isHost && (
            <p style={{ color: "#22426b", fontWeight: "bold" }}>
              You are the host of this trip
            </p>
          )}
        </div>

        {trip.status === "ACTIVE" && (
          <div style={{ marginTop: 16 }}>
            <Button type="primary" style={{ marginRight: 8 }} disabled>
              Add Destination (Coming Soon)
            </Button>
            {isHost && (
              <Button type="default" disabled>
                Final Evaluation (Coming Soon)
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card title="Participants" style={{ marginBottom: 24 }}>
        {participants.length === 0 ? (
          <Empty description="No participants yet" />
        ) : (
          <Table
            dataSource={participants}
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                key: "name",
              },
              {
                title: "Username",
                dataIndex: "username",
                key: "username",
              },
            ]}
            pagination={false}
            rowKey={(record) => record.id || ""}
          />
        )}
      </Card>
    </div>
  );
}
