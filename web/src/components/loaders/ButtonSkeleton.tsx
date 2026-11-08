import { Skeleton } from "../ui/skeleton";

type Size = {
  size: "xs" | "sm" | "md" | "lg";
};

const ButtonSkeleton = ({ size }: Size) => {
  const sizeStyles = {
    xs: "h-7 w-32 rounded-md",
    sm: "h-8 w-34 rounded-md",
    md: "h-9 w-36 rounded-md",
    lg: "h-10 w-38 rounded-md",
  };

  return <Skeleton className={sizeStyles[size]} />;
};

export default ButtonSkeleton;
