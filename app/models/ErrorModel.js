const errorData = {
    400: {
        title: "Bad Request",
        status: "400",
        message: "The request could not be understood by the server due to malformed syntax.",
    },
    401: {
        title: "Unauthorized",
        status: "401",
        message: "You must be authenticated to access this resource.",
    },
    403: {
        title: "Forbidden",
        status: "403",
        message: "You do not have permission to access this resource.",
    },
    404: {
        title: "Page Not Found",
        status: "404",
        message: "The page you are looking for was moved, removed, or might never have existed.",
    },
    408: {
        title: "Request Timeout",
        status: "408",
        message: "The server timed out waiting for your request. Please try again.",
    },
    429: {
        title: "Too Many Requests",
        status: "429",
        message: "You have sent too many requests in a short period. Please slow down.",
    },
    500: {
        title: "Internal Server Error",
        status: "500",
        message: "Something went wrong on our end. Please try again later.",
    },
    502: {
        title: "Bad Gateway",
        status: "502",
        message: "The server received an invalid response from the upstream server.",
    },
    503: {
        title: "Service Unavailable",
        status: "503",
        message: "The service is temporarily unavailable. Please try again later.",
    },
    504: {
        title: "Gateway Timeout",
        status: "504",
        message: "The upstream server did not respond in time.",
    },
}

module.exports = errorData;