export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function apiResponse<T>(
  data: T,
  statusCode: number = 200,
) {
  return Response.json(
    { success: true, data },
    { status: statusCode },
  )
}

export function apiError(
  message: string,
  statusCode: number = 400,
) {
  return Response.json(
    { success: false, error: message },
    { status: statusCode },
  )
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return apiError(error.message, error.statusCode)
  }
  if (error instanceof Error) {
    return apiError(error.message, 500)
  }
  return apiError('An unexpected error occurred', 500)
}
