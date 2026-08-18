export type ErrorContext = Record<string, unknown>;

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown application error");
  }
}

export function sanitizeErrorContext(context: ErrorContext = {}): ErrorContext {
  const blockedTerms = ["note", "notes", "medicalNote", "painNote", "description", "freeText"];

  return Object.fromEntries(
    Object.entries(context).filter(([key, value]) => {
      if (value === undefined) return false;
      return !blockedTerms.some((term) => key.toLowerCase().includes(term.toLowerCase()));
    })
  );
}
