const httpErrors = {
    400: { title: "Bad Request", message: "The request could not be understood or was missing required parameters." },
    401: { title: "Unauthorized", message: "Authentication failed or user does not have permissions for the desired action." },
    402: { title: "Payment Required", message: "Payment is required to access this resource." },
    403: { title: "Forbidden", message: "You do not have permission to access this resource." },
    404: { title: "Not Found", message: "The requested resource could not be found." },
    405: { title: "Method Not Allowed", message: "The HTTP method used is not allowed for this resource." },
    406: { title: "Not Acceptable", message: "The requested resource is not available in a format acceptable to your browser." },
    407: { title: "Proxy Authentication Required", message: "You must authenticate with a proxy server before proceeding." },
    408: { title: "Request Timeout", message: "The server timed out waiting for the request." },
    409: { title: "Conflict", message: "There was a conflict with the current state of the resource." },
    410: { title: "Gone", message: "The requested resource is no longer available and will not be available again." },
    411: { title: "Length Required", message: "The request did not specify the length of its content." },
    412: { title: "Precondition Failed", message: "The server does not meet one of the preconditions specified in the request." },
    413: { title: "Payload Too Large", message: "The request is larger than the server is willing or able to process." },
    414: { title: "URI Too Long", message: "The URI provided was too long for the server to process." },
    415: { title: "Unsupported Media Type", message: "The request entity has a media type which the server or resource does not support." },
    416: { title: "Range Not Satisfiable", message: "The client has asked for a portion of the file, but the server cannot supply that portion." },
    417: { title: "Expectation Failed", message: "The server cannot meet the requirements of the Expect request-header field." },
    418: { title: "I'm a teapot", message: "The server refuses to brew coffee because it is, permanently, a teapot." },
    421: { title: "Misdirected Request", message: "The request was directed at a server that is not able to produce a response." },
    422: { title: "Unprocessable Entity", message: "The request was well-formed but unable to be followed due to semantic errors." },
    423: { title: "Locked", message: "The resource that is being accessed is locked." },
    424: { title: "Failed Dependency", message: "The request failed due to failure of a previous request." },
    425: { title: "Too Early", message: "Indicates that the server is unwilling to risk processing a request that might be replayed." },
    426: { title: "Upgrade Required", message: "The client should switch to a different protocol." },
    428: { title: "Precondition Required", message: "The origin server requires the request to be conditional." },
    429: { title: "Too Many Requests", message: "The user has sent too many requests in a given amount of time." },
    431: { title: "Request Header Fields Too Large", message: "The server is unwilling to process the request because its header fields are too large." },
    451: { title: "Unavailable For Legal Reasons", message: "The resource is unavailable due to legal reasons." },

    500: { title: "Internal Server Error", message: "The server encountered an unexpected condition." },
    501: { title: "Not Implemented", message: "The server does not support the functionality required to fulfill the request." },
    502: { title: "Bad Gateway", message: "The server received an invalid response from the upstream server." },
    503: { title: "Service Unavailable", message: "The server is currently unavailable (overloaded or down)." },
    504: { title: "Gateway Timeout", message: "The server did not receive a timely response from the upstream server." },
    505: { title: "HTTP Version Not Supported", message: "The server does not support the HTTP protocol version used in the request." },
    506: { title: "Variant Also Negotiates", message: "The server has an internal configuration error." },
    507: { title: "Insufficient Storage", message: "The server is unable to store the representation needed to complete the request." },
    508: { title: "Loop Detected", message: "The server detected an infinite loop while processing the request." },
    510: { title: "Not Extended", message: "Further extensions to the request are required for the server to fulfill it." },
    511: { title: "Network Authentication Required", message: "The client needs to authenticate to gain network access." }
};

function getErrorData(status) {
    if (httpErrors[status]) {
        return { status, ...httpErrors[status] };
    } else {
        return { status, title: "Unknown Error", message: "No information available for this status code." };
    }
}


module.exports = getErrorData;