/**
 * * Creates an error object with the given status code and message.
 * @param {Number} status The HTTP status code for the error.
 * @param {String} message The message to be included in the error object.
 * @returns {Object} An error object containing the status code and message.
 */
const CreateError = (status, message) => {
    const err = new Error();
    err.status = status,
    err.message = message;

    return err
};

module.exports = { CreateError };