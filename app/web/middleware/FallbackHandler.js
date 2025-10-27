const FallbackHandler = (req, res, next) => {
    if (!res.headersSent) {
        return error(res, 404);
    }
    next();
};

module.exports = FallbackHandler;
