import api from "./api";

export interface BackendSetting {
  key: string;
  value: unknown;
}

export async function getBackendSettings(): Promise<BackendSetting[]> {
  const response = await api.get<BackendSetting[]>("/settings");
  return response.data;
}

export async function saveBackendSetting(setting: BackendSetting): Promise<BackendSetting> {
  const response = await api.put<BackendSetting>(`/settings/${encodeURIComponent(setting.key)}`, {
    value: setting.value,
  });
  return response.data;
}
