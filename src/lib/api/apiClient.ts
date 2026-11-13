import { z, type ZodType } from "zod";

const API_PREFIX = "/api/v1";
// VITE_API_BASE_URL is the backend's origin when it is not served from the same one; empty in
// production, where Vercel proxies /api to the backend.
const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(
  /\/$/,
  "",
);

export const NETWORK_ERROR = "NETWORK_ERROR";
export const BAD_RESPONSE = "BAD_RESPONSE";

// The backend answers every error as application/problem+json with a stable reasonCode.
export class ApiError extends Error {
  readonly status: number;
  readonly reasonCode: string;
  readonly requestId: string | undefined;

  constructor(status: number, reasonCode: string, detail: string, requestId?: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.reasonCode = reasonCode;
    this.requestId = requestId;
  }
}

const problemSchema = z.object({
  detail: z.string().optional(),
  title: z.string().optional(),
  reasonCode: z.string().optional(),
  requestId: z.string().optional(),
});

type Query = Record<string, string | number | boolean | undefined>;

export type ApiRequest = {
  method?: "GET" | "POST" | "DELETE";
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
};

// A path the backend returned (it already carries /api/v1), made fetchable from this origin.
export const absoluteApiPath = (path: string): string => `${API_BASE}${path}`;

export const apiUrl = (path: string, query: Query = {}): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) params.set(key, String(value));
  const search = params.size > 0 ? `?${params}` : "";
  return `${API_BASE}${API_PREFIX}${path}${search}`;
};

const failure = async (response: Response): Promise<ApiError> => {
  const parsed = problemSchema.safeParse(await response.json().catch(() => undefined));
  const problem = parsed.success ? parsed.data : {};
  return new ApiError(
    response.status,
    problem.reasonCode ?? `HTTP_${response.status}`,
    problem.detail ?? problem.title ?? `The server answered HTTP ${response.status}`,
    problem.requestId,
  );
};

// Validates every answer against its schema, so a drifting backend fails loudly at the boundary.
export const apiRequest = async <T>(
  path: string,
  schema: ZodType<T>,
  { method = "GET", query, body, signal }: ApiRequest = {},
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(apiUrl(path, query), {
      method,
      ...(signal && { signal }),
      ...(body !== undefined && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, NETWORK_ERROR, "The server could not be reached");
  }
  if (!response.ok) throw await failure(response);
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success)
    throw new ApiError(response.status, BAD_RESPONSE, "The server answered in an unexpected shape");
  return parsed.data;
};
