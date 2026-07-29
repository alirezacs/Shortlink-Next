import { apiClient } from "@/lib/api/client";
import type {
  Setting,
  SettingCategory,
  SettingCategoryInput,
  SettingInput,
  SettingUpdateInput,
} from "@/lib/settings/types";

class SettingsService {
  list() { return apiClient.request<Setting[]>("/api/settings"); }
  get(id: string | number) { return apiClient.request<Setting>(`/api/settings/${id}`); }
  create(input: SettingInput) { return apiClient.request<Setting>("/api/settings", { method: "POST", body: input }); }
  update(id: string | number, input: SettingUpdateInput) { return apiClient.request<Setting>(`/api/settings/${id}`, { method: "PATCH", body: input }); }
  remove(id: string | number) { return apiClient.request<{ success: true }>(`/api/settings/${id}`, { method: "DELETE" }); }
}

class SettingCategoriesService {
  list() { return apiClient.request<SettingCategory[]>("/api/settings/categories"); }
  get(id: string | number) { return apiClient.request<SettingCategory>(`/api/settings/categories/${id}`); }
  create(input: SettingCategoryInput) { return apiClient.request<SettingCategory>("/api/settings/categories", { method: "POST", body: input }); }
  update(id: string | number, input: Partial<SettingCategoryInput>) { return apiClient.request<SettingCategory>(`/api/settings/categories/${id}`, { method: "PATCH", body: input }); }
  remove(id: string | number) { return apiClient.request<{ success: true }>(`/api/settings/categories/${id}`, { method: "DELETE" }); }
}

export const settingsService = new SettingsService();
export const settingCategoriesService = new SettingCategoriesService();
