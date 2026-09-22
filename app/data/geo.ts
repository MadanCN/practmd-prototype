// Country → State → City reference data for the provider address cascade.
// Mirrors what Global Masters > Organization > Locations (Country / State /
// City) will serve once those masters are shared; until then they are local
// seed screens, so the provider form reads this module.

export interface GeoState { name: string; code: string; cities: string[] }
export interface GeoCountry { name: string; code: string; states: GeoState[] }

export const GEO: GeoCountry[] = [
  {
    name: "United States", code: "US",
    states: [
      { name: "New York", code: "NY", cities: ["Albany", "Brighton", "Buffalo", "Canandaigua", "Farmington", "Ithaca", "Lansing", "New Hartford", "New York", "Penfield", "Pittsford", "Rochester", "Schenectady", "Syracuse", "Utica"] },
      { name: "New Jersey", code: "NJ", cities: ["Atlantic City", "Newark", "Ocean City", "Princeton", "Trenton"] },
      { name: "Connecticut", code: "CT", cities: ["Bridgeport", "Hartford", "New Haven", "Stamford"] },
      { name: "Pennsylvania", code: "PA", cities: ["Erie", "Harrisburg", "Philadelphia", "Pittsburgh"] },
      { name: "Massachusetts", code: "MA", cities: ["Boston", "Cambridge", "Springfield", "Worcester"] },
      { name: "Florida", code: "FL", cities: ["Jacksonville", "Miami", "Orlando", "Tampa"] },
      { name: "California", code: "CA", cities: ["Los Angeles", "Sacramento", "San Diego", "San Francisco"] },
      { name: "Texas", code: "TX", cities: ["Austin", "Dallas", "Houston", "San Antonio"] },
    ],
  },
  {
    name: "Canada", code: "CA",
    states: [
      { name: "Ontario", code: "ON", cities: ["Ottawa", "Toronto"] },
      { name: "Quebec", code: "QC", cities: ["Montreal", "Quebec City"] },
      { name: "British Columbia", code: "BC", cities: ["Vancouver", "Victoria"] },
    ],
  },
];

export const DEFAULT_COUNTRY = "United States";

export const statesOf = (country: string): GeoState[] => GEO.find((c) => c.name === country)?.states ?? [];
export const citiesOf = (country: string, state: string): string[] => statesOf(country).find((s) => s.name === state)?.cities ?? [];
