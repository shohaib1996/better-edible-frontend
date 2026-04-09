export const getStatusStyle = (status: string, isSample: boolean) => {
  if (isSample) {
    return "border-l-4 border-l-purple-500 rounded-xs";
  }
  switch (status) {
    case "submitted":
      return "border-l-4 border-l-blue-600 rounded-xs";
    case "accepted":
      return "border-l-4 border-l-yellow-600 rounded-xs";
    case "manifested":
      return "border-l-4 border-l-emerald-600 rounded-xs";
    case "shipped":
      return "border-l-4 border-l-green-600 rounded-xs";
    case "cancelled":
      return "border-l-4 border-l-red-600 rounded-xs";
    default:
      return "border-l-4 border-l-border rounded-xs";
  }
};

export const getStatusSelectBg = (status: string) => {
  switch (status) {
    case "submitted":
      return "bg-blue-600 text-white dark:bg-blue-600 dark:text-white";
    case "accepted":
      return "bg-secondary text-secondary-foreground dark:bg-yellow-600 dark:text-white";
    case "manifested":
      return "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white";
    case "shipped":
      return "bg-green-600 text-white dark:bg-green-600 dark:text-white";
    case "cancelled":
      return "bg-destructive text-white dark:bg-red-600 dark:text-white";
    default:
      return "bg-foreground text-background dark:bg-foreground dark:text-white";
  }
};
