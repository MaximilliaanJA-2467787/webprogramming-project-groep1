const morgan = require("morgan");
const chalk = require("chalk").default;
const rfs = require("rotating-file-stream");
const path = require("path");
const fs = require("fs");
const config = require('../config/config');

const logDirectory = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: logDirectory,
});

morgan.token("statusColor", (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return chalk.red(status);
  if (status >= 400) return chalk.yellow(status);
  if (status >= 300) return chalk.cyan(status);
  if (status >= 200) return chalk.green(status);
  return status;
});

morgan.token("methodColor", (req) => {
  const method = req.method;
  const colors = {
    GET: chalk.green.bold,
    POST: chalk.blue.bold,
    PUT: chalk.yellow.bold,
    DELETE: chalk.red.bold,
    PATCH: chalk.magenta.bold,
  };
  return (colors[method] || chalk.white.bold)(method);
});

const devFormat = (tokens, req, res) => {
  const time = chalk.gray(tokens["response-time"](req, res) + " ms");
  const method = tokens.methodColor(req, res);
  const url = chalk.white(tokens.url(req, res));
  const status = tokens.statusColor(req, res);
  const size = chalk.dim(tokens.res(req, res, "content-length") || "-");
  const date = chalk.gray(new Date().toLocaleTimeString());

  return `${date} | ${method} ${url} → ${status} [${time}, ${size}]`;
};

// Export middleware based on environment
module.exports = (app) => {
  if (config.env === "production") {
    app.use(
      morgan("combined", {
        stream: accessLogStream,
      })
    );
  } else {
    // Pretty colored logs in dev
    app.use(morgan(devFormat));
  }
};
