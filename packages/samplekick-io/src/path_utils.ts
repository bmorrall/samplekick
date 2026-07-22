export const getPathName = (path: string): string => {
  const [name = ""] = path.split("/").reverse();
  return name;
};

// "".split("/") yields [""], not [] — special-case so the root path resolves
// to zero path segments (used by Registry#findEntryNode to look up the root
// node itself via an empty-string path).
export const splitPath = (path: string): string[] =>
  path === "" ? [] : path.split("/");
