export interface ApiErrorDetail {
  path?: Array<string | number>;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const successResponse = <T>(
  message: string,
  data: T,
): ApiSuccess<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (
  message: string,
  errors: ApiErrorDetail[] = [],
): ApiFailure => ({
  success: false,
  message,
  errors,
});
