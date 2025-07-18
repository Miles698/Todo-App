export const normalizeProject = (project) => {
  if (!project) return "#Inbox";                          // fallback
  const cleaned = project.trim().replace(/^#+/, "");      // remove leading #
  return `#${cleaned}`;                                   // add exactly one #
};
