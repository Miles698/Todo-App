export const normalizeProject = (base) => {
  if (typeof base !== "string") return "#Inbox"; // or fallback value
  return base.replace(/[^#\w/-]/g, "").trim();
};
