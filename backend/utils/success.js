/**
 * * Creates a success object with the given status code, message and data.
 * 
 * @param {Number} statusCode HTTP status code.
 * @param {String} successMessage The message to be included in the success object.
 * @param {any} data The data to be included in the success object.
 * @returns {Object} A success object containing the status code, message and data.
 */
const CreateSuccess = (statusCode, successMessage, data) => {
    const successObj = {
        status: statusCode,
        message: successMessage,
        data: data
    }

    return successObj;
};

module.exports = { CreateSuccess };