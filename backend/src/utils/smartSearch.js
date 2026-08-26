// Very small rule-based parser that turns a free-text query like
// "2 BHK under 20k in Jaipur" or "Furnished flat near JECRC University"
// into structured filters. Not an ML model -- a handful of regexes that
// cover the patterns called out in the product spec. Easy to swap for an
// LLM-based parser later without changing the route contract.

function parseSmartQuery(query = "") {
  const q = query.toLowerCase();
  const filters = {};

  // BHK, e.g. "2 bhk", "3bhk"
  const bhkMatch = q.match(/(\d+)\s*\+?\s*bhk/);
  if (bhkMatch) filters.bhk = parseInt(bhkMatch[1], 10);

  // Max rent, e.g. "under 20k", "under ₹20,000", "below 15000"
  const rentMatch = q.match(/(?:under|below|less than)\s*₹?\s*([\d,]+)\s*(k)?/);
  if (rentMatch) {
    let value = parseInt(rentMatch[1].replace(/,/g, ""), 10);
    if (rentMatch[2]) value *= 1000;
    filters.maxRent = value;
  }

  // Furnishing
  if (/\bfully\s*furnished\b|\bfurnished\b/.test(q) && !/semi\s*furnished/.test(q)) {
    filters.furnishing = "FURNISHED";
  } else if (/semi\s*furnished/.test(q)) {
    filters.furnishing = "SEMI_FURNISHED";
  } else if (/unfurnished/.test(q)) {
    filters.furnishing = "UNFURNISHED";
  }

  // No brokerage
  if (/no\s*brokerage|no\s*broker/.test(q)) filters.noBrokerage = true;

  // Pet friendly
  if (/pet\s*friendly/.test(q)) filters.petFriendly = true;

  // Location: text after "in"/"near"/"at", stripped of trailing filter words
  const locMatch = q.match(/(?:in|near|at)\s+([a-z0-9\s]+)$/);
  if (locMatch) {
    filters.locationText = locMatch[1].trim();
  }

  // Property type keyword
  if (/\bpg\b/.test(q)) filters.propertyType = "PG";
  else if (/\bvilla\b/.test(q)) filters.propertyType = "VILLA";
  else if (/independent\s*house/.test(q)) filters.propertyType = "INDEPENDENT_HOUSE";
  else if (/\broom\b/.test(q)) filters.propertyType = "ROOM";
  else if (/\bflat\b|\bapartment\b/.test(q)) filters.propertyType = "APARTMENT";

  return filters;
}

module.exports = { parseSmartQuery };
