// api_client.ts

/**
 * @file This file contains the generated API client for the example API.
 * It includes type definitions, error handling, and the API client implementation.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

// ====================
// Type Definitions
// ====================

/**
 * Represents a User object.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Represents the response for the getUsers endpoint.
 */
export interface GetUsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

// ====================
// Error Handling
// ====================

/**
 * Custom error class for API related errors.
 */
export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype); // Required for instanceof to work correctly
  }
}

// ====================
// Utility Functions
// ====================

/**
 * Converts a Date object to an ISO date string.
 * @param date The Date object to convert.
 * @returns The ISO date string.
 */
function dateToIsoString(date: Date): string {
  return date.toISOString();
}

/**
 * Converts an ISO date string to a Date object.
 * @param dateString The ISO date string to convert.
 * @returns The Date object.
 */
function isoStringToDate(dateString: string): Date {
  return new Date(dateString);
}

// ====================
// API Client
// ====================

/**
 * Configuration options for the API client.
 */
export interface ApiClientOptions {
  baseUrl: string;
  authToken?: string;
  logger?: (message: string) => void; // Optional logger function
}

/**
 * API client class for interacting with the example API.
 */
export class ApiClient {
  private readonly axiosInstance: AxiosInstance;
  private authToken: string | null = null;
  private readonly logger: (message: string) => void;

  /**
   * Constructs a new ApiClient instance.
   * @param options Configuration options for the API client.
   */
  constructor(private readonly options: ApiClientOptions) {
    this.axiosInstance = axios.create({
      baseURL: options.baseUrl,
      timeout: 10000, // Set a default timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.authToken = options.authToken || null;
    this.logger = options.logger || (() => {}); // Default to a no-op logger

    this.axiosInstance.interceptors.request.use(config => {
      if (this.authToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.authToken}`,
        };
      }
      this.logger(`Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    }, error => {
      this.logger(`Request Error: ${error}`);
      return Promise.reject(error);
    });

    this.axiosInstance.interceptors.response.use(response => {
      this.logger(`Response: ${response.status} ${response.config.url}`);
      return response;
    }, error => {
      this.logger(`Response Error: ${error}`);
      return Promise.reject(error);
    });
  }

  /**
   * Sets the authentication token.
   * @param token The authentication token.
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clears the authentication token.
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
        const status = error.response?.status;
        const data = error.response?.data;
        throw new ApiError(message, status, data);
      } else {
        throw new ApiError('An unexpected error occurred.', undefined, error);
      }
    }
  }

  /**
   * Gets a list of users.
   * @param params Optional parameters for pagination.
   * @param cancelToken Optional cancel token.
   * @returns A promise that resolves to the GetUsersResponse.
   */
  async getUsers(params?: { page?: number; limit?: number }, cancelToken?: any): Promise<GetUsersResponse> {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: '/users',
      params: params,
      cancelToken: cancelToken
    };
    return this.request<GetUsersResponse>(config);
  }

  /**
   * Gets a specific user by ID.
   * @param id The ID of the user to retrieve.
   * @param cancelToken Optional cancel token.
   * @returns A promise that resolves to the User object.
   */
  async getUser(id: string, cancelToken?: any): Promise<User> {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `/users/${id}`,
      cancelToken: cancelToken
    };
    return this.request<User>(config);
  }

  /**
   * Creates a new user.
   * @param data The data for the new user.
   * @param cancelToken Optional cancel token.
   * @returns A promise that resolves to the created User object.
   */
  async createUser(data: { name: string; email: string; age?: number }, cancelToken?: any): Promise<User> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: '/users',
      data: data,
      cancelToken: cancelToken
    };
    return this.request<User>(config);
  }
}

// ====================
// Usage Example
// ====================

/**
 * Example usage of the ApiClient.
 */
async function exampleUsage(): Promise<void> {
  const apiClient = new ApiClient({
    baseUrl: 'https://api.example.com/v1',
    authToken: 'your_auth_token',
    logger: (message) => console.log(`API: ${message}`)
  });

  try {
    // Get users
    const usersResponse = await apiClient.getUsers({ page: 1, limit: 10 });
    console.log('Users:', usersResponse.users);

    // Get a specific user
    if (usersResponse.users.length > 0) {
      const userId = usersResponse.users[0].id;
      const user = await apiClient.getUser(userId);
      console.log('User:', user);
    }

    // Create a new user
    const newUser = await apiClient.createUser({ name: 'John Doe', email: 'john.doe@example.com', age: 30 });
    console.log('New User:', newUser);

  } catch (error: any) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message, error.status, error.data);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

// Uncomment to run the example
// exampleUsage();
