import { AxiosError } from 'axios';
import { Response } from 'express';

export function buildResponse(res: Response, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'access-control-allow-methods': '*',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
  });
  return res.end(data ? JSON.stringify(data) : null);
}

export function handleError(error: Error, res: Response) {
  if (error instanceof AxiosError) {
    return buildResponse(res, error.response.status, error.response.data);
  }

  return buildResponse(res, 502, {
    message: error.message ?? 'Bad gateway',
    statusCode: 502,
  });
}

export function getPathname(...pathParts: string[]) {
  return pathParts.join('/');
}

export function stringify(obj: object) {
  let cache = [];
  const str = JSON.stringify(obj, function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // reset the cache

  return str;
}
