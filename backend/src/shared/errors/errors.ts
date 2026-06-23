class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/* ------------------------------ Basic errors ------------------------------ */

class Error401NotAuthorized extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 401);
  }
}

class Error403Forbidden extends AppError {
  constructor(message = 'Invalid domain access') {
    super(message, 403);
  }
}

class Error404NotFound extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

class Error409Conflict extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409); // Conflict
  }
}

class Error422Unprocessable extends AppError {
  constructor(message = 'Unprocessable entity') {
    super(message, 422);
  }
}

class Error429RateLimited extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

export {
  Error401NotAuthorized,
  Error403Forbidden,
  Error404NotFound,
  Error409Conflict,
  Error422Unprocessable,
  Error429RateLimited,
};
