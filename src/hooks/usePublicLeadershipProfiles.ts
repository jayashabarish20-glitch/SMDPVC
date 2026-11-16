import { useEffect, useState } from "react";
import {
  leadershipApi,
  type LeadershipProfile,
} from "../services/leadershipApi";

export function usePublicLeadershipProfiles() {
  const [profiles, setProfiles] = useState<LeadershipProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    leadershipApi
      .getPublicProfiles()
      .then((result) => {
        if (active) setProfiles(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "Unable to load leadership profiles.";
        console.error("Failed to load public leadership profiles:", cause);
        setError(message);
      });

    return () => {
      active = false;
    };
  }, []);

  return { profiles, error };
}
