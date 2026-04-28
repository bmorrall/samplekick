export const getPathName = (path: string): string => {
  const [name = ""] = path.split("/").reverse();
  return name;
};

export const splitPath = (path: string): string[] => path.split("/");
