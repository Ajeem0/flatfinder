export type UserType = "TENANT" | "OWNER" | "AGENT" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  adminPhone?: string | null;
  userType: UserType;
  profilePhotoUrl?: string | null;
  preferredLocation?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
}

export type PropertyType = "APARTMENT" | "INDEPENDENT_HOUSE" | "VILLA" | "PG" | "ROOM" | "FLATMATE";
export type Furnishing = "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED";
export type ListingStatus = "PENDING" | "PUBLISHED" | "REJECTED" | "RENTED" | "ARCHIVED";

export interface PropertyOwner {
  id: string;
  name: string;
  userType: UserType;
  profilePhotoUrl?: string | null;
  isPhoneVerified: boolean;
  phone?: string | null;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  bhk: number | null;
  areaSqft: number | null;
  floor: number | null;
  totalFloors: number | null;
  furnishing: Furnishing;
  propertyAgeYears: number | null;
  monthlyRent: number;
  securityDeposit: number;
  maintenance: number;
  brokerage: number;
  noBrokerage: boolean;
  bachelorFriendly: boolean;
  familyFriendly: boolean;
  petFriendly: boolean;
  availableFrom: string | null;
  status: ListingStatus;
  viewCount: number;
  address: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  locationName: string | null;
  videoUrl: string | null;
  images: string[];
  amenities: string[];
  owner: PropertyOwner | null;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PropertySearchResponse {
  results: Property[];
  pagination: Pagination;
}

export interface FavoriteItem {
  favoriteId: string;
  propertyId: string;
  slug: string;
  title: string;
  image: string | null;
  monthlyRent: number;
  bhk: number | null;
  city: string | null;
  locationName: string | null;
  status: ListingStatus;
  savedAt: string;
}

export interface Enquiry {
  id: string;
  message: string | null;
  status: "NEW" | "RESPONDED" | "CLOSED";
  createdAt: string;
  property: { id: string; title: string; slug: string; monthlyRent: number };
  user?: { id: string; name: string; email: string; phone: string | null };
}

export interface Visit {
  id: string;
  scheduledDate: string;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  property: { id: string; title: string; slug: string };
  user?: { id: string; name: string; phone: string | null };
}

export interface CityWithLocalities {
  id: string;
  name: string;
  state: string | null;
  isPopular: boolean;
  localities: string[];
}
