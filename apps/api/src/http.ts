import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError, type z } from 'zod';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const unauthorized = (message = 'Please log in') =>
  new HttpError(401, 'unauthorized', message);
export const forbidden = (message = 'You do not have access to this') =>
  new HttpError(403, 'forbidden', message);
export const notFound = (message = 'Not found') => new HttpError(404, 'not_found', message);
export const badRequest = (message: string) => new HttpError(400, 'bad_request', message);
export const conflict = (message: string) => new HttpError(409, 'conflict', message);

/** Parses input with a zod schema. Throws a ZodError (turned into a 400) on failure. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  return schema.parse(input);
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (res.headersSent) {
    // A streamed response failed halfway (for example a CSV export). End it.
    res.destroy(err instanceof Error ? err : undefined);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: err.issues[0]?.message ?? 'Invalid input',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // express.json() parse errors
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res
      .status(400)
      .json({ error: { code: 'bad_json', message: 'Request body is not valid JSON' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong' } });
};
