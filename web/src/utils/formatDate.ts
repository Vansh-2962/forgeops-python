import { formatDistanceToNow } from "date-fns";

export const formatRelativeDate = (date: Date | string): string => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
};
