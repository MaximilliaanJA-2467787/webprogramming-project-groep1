class Logger {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            info: '\x1b[36m', // Cyan
            success: '\x1b[32m', // Green
            error: '\x1b[31m', // Red
            warn: '\x1b[33m', // Yellow
            debug: '\x1b[35m', // Magenta
        };
    }

    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months 0-11
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    formatMessage(level, color, message) {
        return `${this.colors.dim}[${this.getTimestamp()}]${this.colors.reset} ${color}${level.toUpperCase()}${this.colors.reset}: ${message}`;
    }

    info(message) {
        console.log(this.formatMessage('info', this.colors.info, message));
    }

    success(message) {
        console.log(this.formatMessage('success', this.colors.success, message));
    }

    error(message) {
        console.log(this.formatMessage('error', this.colors.error, message));
    }

    warn(message) {
        console.log(this.formatMessage('warn', this.colors.warn, message));
    }

    debug(message) {
        console.log(this.formatMessage('debug', this.colors.debug, message));
    }

    logRequest(req) {
        const { method, url, headers, body } = req;

        logger.info(`Incoming request`);
        console.log(this.colors.info + '┌──────────────────────────────────────────────' + this.colors.reset);
        console.log(this.colors.bright + `    ${method} ${url}` + this.colors.reset);
        
        console.log(this.colors.dim + '    Headers:' + this.colors.reset);
        for (const [key, value] of Object.entries(headers)) {
            console.log(`        ${this.colors.debug}${key}: ${value}${this.colors.reset}`);
        }

        if (body && Object.keys(body).length > 0) {
            console.log(this.colors.dim + '    Body:' + this.colors.reset);
            console.log(`        ${this.colors.debug}${JSON.stringify(body, null, 2)}${this.colors.reset}`);
        }

        console.log(this.colors.info + '└──────────────────────────────────────────────\n' + this.colors.reset);
    }

    logError(err) {
        console.log(this.colors.error + '┌─ ERROR ───────────────────────────────────────' + this.colors.reset);

        if (err instanceof Error) {
            console.log(this.colors.bright + `    ${err.name}: ${err.message}` + this.colors.reset);
            if (err.stack) {
                console.log(this.colors.dim + '    Stack trace:' + this.colors.reset);
                err.stack.split('\n').forEach(line => {
                    console.log(`        ${this.colors.debug}${line.trim()}${this.colors.reset}`);
                });
            }
        } else {
            console.log(this.colors.bright + `    ${err}` + this.colors.reset);
        }

        console.log(this.colors.error + '└──────────────────────────────────────────────\n' + this.colors.reset);
    }

}

const logger = new Logger();
module.exports = logger;
