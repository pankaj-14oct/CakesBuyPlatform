import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
  headers?: Record<string, string>
): Promise<Response> {
  // Check for tokens - use unified token storage
  const token = localStorage.getItem('auth_token');
  const deliveryToken = localStorage.getItem('delivery_token');
  
  const defaultHeaders: Record<string, string> = {};
  if (data) {
    defaultHeaders["Content-Type"] = "application/json";
  }
  
  const finalToken = url.includes('/delivery') ? deliveryToken : token;
  if (finalToken) {
    defaultHeaders.Authorization = `Bearer ${finalToken}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check for tokens - use unified token storage
    const token = localStorage.getItem('auth_token');
    const deliveryToken = localStorage.getItem('delivery_token');
    const url = queryKey[0] as string;
    
    const finalToken = url.includes('/delivery') ? deliveryToken : token;
    const headers: Record<string, string> = {};
    
    if (finalToken) {
      headers.Authorization = `Bearer ${finalToken}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
