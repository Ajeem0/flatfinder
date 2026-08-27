import type {
  CityWithLocalities,
  Enquiry,
  FavoriteItem,
  Property,
  PropertySearchResponse,
  User,
  Visit,
} from "../types";

const BASE_URL = import.meta.env.API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "flatfinder_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Can't reach the FlatFinder API. Is the backend running on " + BASE_URL + "?",
      0
    );
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  auth: {
    register: (payload: { name: string; email: string; phone?: string; password: string; userType: string }) =>
      request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (payload: { email: string; password: string }) =>
      request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    me: () => request<{ user: User }>("/auth/me"),
    updateMe: (payload: Partial<User>) =>
      request<{ user: User }>("/auth/me", { method: "PUT", body: JSON.stringify(payload) }),
  },
  properties: {
    search: (params: URLSearchParams) => request<PropertySearchResponse>(`/properties?${params.toString()}`),
    get: (idOrSlug: string) => request<{ property: Property }>(`/properties/${idOrSlug}`),
    create: (payload: Record<string, unknown>) =>
      request<{ property: Property }>("/properties", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: Record<string, unknown>) =>
      request<{ property: Property }>(`/properties/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: string) => request<void>(`/properties/${id}`, { method: "DELETE" }),
    toggleFavorite: (id: string) => request<{ favorited: boolean }>(`/properties/${id}/favorite`, { method: "POST" }),
    mine: () => request<{ results: Property[] }>("/properties/mine"),
  },
  favorites: {
    list: () => request<{ results: FavoriteItem[] }>("/favorites"),
  },
  enquiries: {
    create: (payload: { propertyId: string; message?: string }) =>
      request<{ enquiry: Enquiry }>("/enquiries", { method: "POST", body: JSON.stringify(payload) }),
    list: (asOwner = false) => request<{ results: Enquiry[] }>(`/enquiries${asOwner ? "?asOwner=true" : ""}`),
  },
  visits: {
    create: (payload: { propertyId: string; scheduledDate: string }) =>
      request<{ visit: Visit }>("/visits", { method: "POST", body: JSON.stringify(payload) }),
    list: (asOwner = false) => request<{ results: Visit[] }>(`/visits${asOwner ? "?asOwner=true" : ""}`),
    update: (id: string, payload: Record<string, unknown>) =>
      request<{ visit: Visit }>(`/visits/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  },
  locations: {
    list: () => request<{ results: CityWithLocalities[] }>("/locations"),
  },
  admin: {
    pendingProperties: () => request<{ results: Property[] }>("/admin/properties/pending"),
    allProperties: () => request<{ results: Property[] }>("/admin/properties/all"),
    approveProperty: (id: string) => request<{ property: Property }>(`/admin/properties/${id}/approve`, { method: "POST" }),
    rejectProperty: (id: string) => request<{ property: Property }>(`/admin/properties/${id}/reject`, { method: "POST" }),
  },
};

export { ApiError };
