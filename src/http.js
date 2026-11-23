import { createContext, useContext } from 'react';

export async function api(path, { method = 'GET', body, clerkSessionId } = {}) {
  const response = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(clerkSessionId ? { 'X-PH-Session': clerkSessionId } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    const error = new Error(data?.error || 'The request failed. Try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const ApiContext = createContext(api);
export const useApi = () => useContext(ApiContext);
