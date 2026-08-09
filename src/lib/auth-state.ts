export function authStateDestination(
  previousUserId: string | null | undefined,
  nextUserId: string | null,
): "/" | "/login" | null {
  if (
    previousUserId === undefined ||
    previousUserId === nextUserId ||
    previousUserId === null
  ) {
    return null;
  }

  return nextUserId === null ? "/login" : "/";
}
