/**
 * Creates an error object with the given status code and message.
 */
const CreateError = (status: number, message: string) => {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
};

export { CreateError };
