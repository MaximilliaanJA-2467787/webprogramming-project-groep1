// middleware/LogHandler.js
const Logger = require('../../utils/Logger.js');

const LogHandler = (req, res, next) => {
    Logger.logRequest(req);
    const start = Date.now();
    let done = false;

    const makeInfo = () => ({
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
    });

    const finalize = () => {
        if (done) return;
        done = true;

        if (res.locals && res.locals.__errorLogged) {
            Logger.logInfo && Logger.logInfo(makeInfo());
            return;
        }

        if (res.statusCode >= 500) {
            Logger.logError(new Error(`HTTP ${res.statusCode}`), makeInfo());
        } else if (res.statusCode >= 400) {
            Logger.logError(new Error(`HTTP ${res.statusCode}`), makeInfo());
        } else {
            let info = makeInfo();
            Logger.success(
                `${info.method} '${info.url}' with status ${info.statusCode} | ${info.durationMs}ms`
            );
        }
    };

    const onFinish = () => finalize();
    const onClose = () => finalize();
    const onError = (err) => {
        finalize();
    };

    res.on('finish', onFinish);
    res.on('close', onClose);
    res.on('error', onError);

    next();
};

module.exports = LogHandler;
