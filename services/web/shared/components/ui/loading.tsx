import { cn } from "../../lib/cn";

type LoadingProps = {
  text?: string;
  className?: string;
};

/**
 * Loading text display
 */
const Loading = ({ text = "Loading...", className }: LoadingProps) => {
  return <p className={cn("text-muted-foreground", className)}>{text}</p>;
};

/**
 * Full-page loading display (text)
 * @lintignore
 */
const PageLoading = () => {
  return (
    <div className="flex min-h-stage items-center justify-center">
      <Loading />
    </div>
  );
};

type LoadingSpinnerProps = {
  className?: string;
};

/**
 * Loading spinner
 */
const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <output
      aria-label="Loading"
      className={cn(
        "block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent",
        className,
      )}
    />
  );
};

/**
 * Full-page loading display (spinner)
 */
const FullPageSpinner = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export {
  /** @lintignore */
  PageLoading,
  FullPageSpinner,
};
