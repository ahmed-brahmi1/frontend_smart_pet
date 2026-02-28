/** Backend FeedingSchedule model */
export interface FeedingSchedule {
  id: string;
  device_id: string;
  time_of_day: string; // e.g. "08:30:00" (HH:mm or HH:mm:ss)
  portion_grams?: number | null;
  enabled: boolean;
  created_at: string; // ISO
}

/** Request body for POST /feeding-schedule */
export interface CreateFeedingScheduleDto {
  device_id: string; // UUID
  time_of_day: string; // 'HH:mm' or 'HH:mm:ss'
  portion_grams?: number;
  enabled?: boolean; // default true
}

/** Request body for PATCH /feeding-schedule/:id */
export interface UpdateFeedingScheduleDto {
  time_of_day?: string;
  portion_grams?: number | null;
  enabled?: boolean;
}
