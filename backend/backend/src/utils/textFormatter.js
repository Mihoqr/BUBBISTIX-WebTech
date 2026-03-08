// Convert a string to Title Case
export const toTitleCase = (value) => {
  if (!value) return value;

  return value
    .toLowerCase()
    .split(" ")
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};