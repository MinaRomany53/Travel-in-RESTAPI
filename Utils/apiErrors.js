class APIErrors extends Error {
  constructor(statusCode, status, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.isOperational = true;
  }
}

module.exports = APIErrors;
