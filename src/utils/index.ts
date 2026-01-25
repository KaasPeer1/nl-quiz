export const normalizeString = (str: string) =>
  str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('-', "");
