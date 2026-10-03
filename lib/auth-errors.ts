export function getAuthErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "We couldn't complete that request. Please try again.";
  }

  const clerkError = error as {
    errors?: Array<{ longMessage?: string; message?: string }>;
    message?: string;
  };
  const details = clerkError.errors
    ?.map((item) => item.longMessage ?? item.message)
    .filter((message): message is string => Boolean(message));

  return (
    details?.join(" ") ??
    clerkError.message ??
    "We couldn't complete that request. Please try again."
  );
}
