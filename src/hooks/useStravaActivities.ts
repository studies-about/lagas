import { useQuery } from "@tanstack/react-query";

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;       // metros
  total_elevation_gain: number; // metros
  moving_time: number;   // segundos
  start_date_local: string;
  type: string;
}

async function fetchActivities(token: string): Promise<StravaActivity[]> {
  const res = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=10&page=1",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Error al obtener actividades");
  return res.json();
}

export function useStravaActivities(token: string | null) {
  return useQuery({
    queryKey: ["strava-activities", token],
    queryFn: () => fetchActivities(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}
