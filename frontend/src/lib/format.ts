export function formatRent(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCompactRent(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${amount}`;
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "Immediately";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const FURNISHING_LABEL: Record<string, string> = {
  FURNISHED: "Furnished",
  SEMI_FURNISHED: "Semi-furnished",
  UNFURNISHED: "Unfurnished",
};

export const PROPERTY_TYPE_LABEL: Record<string, string> = {
  APARTMENT: "Apartment",
  INDEPENDENT_HOUSE: "Independent House",
  VILLA: "Villa",
  PG: "PG",
  ROOM: "Room",
  FLATMATE: "Flatmate",
};

export function bhkLabel(bhk: number | null) {
  if (!bhk) return "";
  return `${bhk} BHK`;
}
