/** Backend string enum: exactly two device types */
export type DeviceType = 'COLLAR' | 'FEEDER';

/** Matches backend DeviceStatus */
export type DeviceStatus = 'unclaimed' | 'claimed';

export interface Device {
  id: string;
  mac_address: string;
  type: DeviceType;
  status: DeviceStatus;
  owner_id?: string | null;
  activation_secret?: string;
}

/** Request body for POST /device/claim */
export interface ClaimDeviceDto {
  device_id: string;
  activation_secret: string;
}

/** Request body for POST /device/register */
export interface RegisterDeviceDto {
  mac_address: string;
  type: DeviceType;
  activation_secret: string;
  owner_id?: string;
}

/** Request body for PATCH /device/:id */
export interface UpdateDeviceDto {
  mac_address?: string;
  type?: DeviceType;
  status?: DeviceStatus;
  owner_id?: string | null;
}
