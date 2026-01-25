import type { City } from "../types";

export const toQuestion = (city: City) => ({
  id: city.id,
  prompt: city.name,
  payload: city,
});
