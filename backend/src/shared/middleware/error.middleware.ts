import type { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  console.error(`[Error] ${err.message}`);
  if (process.env.DEVELOPMENT) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export default errorMiddleware;
