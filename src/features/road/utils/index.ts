import type { Road } from "../types";

export const toQuestion = (road: Road) => ({
  id: road.id,
  prompt: road.name,
  payload: road,
});
