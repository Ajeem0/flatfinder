import type {
  CityWithLocalities,
  Enquiry,
  FavoriteItem,
  Property,
  PropertySearchResponse,
  User,
  Visit,
  Conversation,
  ChatMessage,
} from "../types";

const BASE_URL = import.meta.env.API_URL || "https://flatfinder-1.onrender.com/api";
const TOKEN_KEY = "flatfinder_token";
const PROPERTY_SEARCH_CACHE_PREFIX = "flatfinder:property-search:";
const PROPERTY_SEARCH_CACHE_TTL = 60_000;

type CachedPropertySearch = { data: PropertySearchResponse; cachedAt: number };
const propertySearchCache = new Map<string, CachedPropertySearch>();

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

async function cachedPropertySearch(params: URLSearchParams, cacheKey: string) {
  const key = `${cacheKey}?${params.toString()}`;
  const now = Date.now();
  const memoryValue = propertySearchCache.get(key);
  if (memoryValue && now - memoryValue.cachedAt < PROPERTY_SEARCH_CACHE_TTL) return memoryValue.data;

  try {
    const stored = sessionStorage.getItem(`${PROPERTY_SEARCH_CACHE_PREFIX}${key}`);
    if (stored) {
      const value = JSON.parse(stored) as CachedPropertySearch;
      if (now - value.cachedAt < PROPERTY_SEARCH_CACHE_TTL) {
        propertySearchCache.set(key, value);
        return value.data;
      }
      sessionStorage.removeItem(`${PROPERTY_SEARCH_CACHE_PREFIX}${key}`);
    }
  } catch {
  }

  const data = await request<PropertySearchResponse>(`/properties?${params.toString()}`);
  const value = { data, cachedAt: now };
  propertySearchCache.set(key, value);
  try {
    sessionStorage.setItem(`${PROPERTY_SEARCH_CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
  }
  return data;
}

export function clearPropertySearchCache() {
  propertySearchCache.clear();
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PROPERTY_SEARCH_CACHE_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
  }
}

export const api = {
  auth: {
    register: (payload: { name: string; email: string; phone?: string; password: string; userType: string }) =>
      request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (payload: { email: string; password: string }) =>
      request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    google: (credential: string, userType = "TENANT") =>
      request<{ token: string; user: User }>("/auth/google", { method: "POST", body: JSON.stringify({ credential, userType }) }),
    me: () => request<{ user: User }>("/auth/me"),
    updateMe: (payload: Partial<User>) =>
      request<{ user: User }>("/auth/me", { method: "PUT", body: JSON.stringify(payload) }),
    requestPhoneOtp: (phone: string) =>
      request<{ verified: boolean; message?: string }>("/auth/phone/request", { method: "POST", body: JSON.stringify({ phone }) }),
    verifyPhoneOtp: (code: string) =>
      request<{ user: User }>("/auth/phone/verify", { method: "POST", body: JSON.stringify({ code }) }),
    updateAdminPassword: (payload: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>("/auth/admin/password", { method: "PUT", body: JSON.stringify(payload) }),
  },
  properties: {
    search: (params: URLSearchParams, cacheKey?: string) =>
      cacheKey
        ? cachedPropertySearch(params, cacheKey)
        : request<PropertySearchResponse>(`/properties?${params.toString()}`),
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
    users: () => request<{ results: Array<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      adminPhone: string | null;
      userType: string;
      profilePhotoUrl: string | null;
      isPhoneVerified: boolean;
      preferredLocation: string | null;
      budgetMin: number | null;
      budgetMax: number | null;
      propertyPreference: string | null;
      createdAt: string;
      updatedAt: string;
      _count: { properties: number; favorites: number; enquiriesSent: number; visits: number; messages: number; conversationsStarted: number; conversationsReceived: number };
    }> }>("/admin/users"),
    updateUserPhone: (id: string, phone: string) =>
      request<{ user: { id: string; phone: string | null } }>(`/admin/users/${id}/phone`, { method: "PUT", body: JSON.stringify({ phone }) }),
    verifyOwner: (id: string) =>
      request<{ user: { id: string; isPhoneVerified: boolean } }>(`/admin/users/${id}/verify`, { method: "POST" }),
    pendingProperties: () => request<{ results: Property[] }>("/admin/properties/pending"),
    allProperties: () => request<{ results: Property[] }>("/admin/properties/all"),
    approveProperty: (id: string) => request<{ property: Property }>(`/admin/properties/${id}/approve`, { method: "POST" }),
    rejectProperty: (id: string) => request<{ property: Property }>(`/admin/properties/${id}/reject`, { method: "POST" }),
  },
  chats: {
    list: () => request<{ results: Conversation[] }>("/chats"),
    start: (propertyId: string) => request<{ conversation: Conversation }>("/chats", { method: "POST", body: JSON.stringify({ propertyId }) }),
    messages: (id: string) => request<{ results: ChatMessage[] }>(`/chats/${id}/messages`),
    send: (id: string, body: string) => request<{ message: ChatMessage }>(`/chats/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
    block: (id: string) => request<{ blocked: boolean }>(`/chats/${id}/block`, { method: "POST" }),
  },
};

export { ApiError };
