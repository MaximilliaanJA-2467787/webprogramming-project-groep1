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
        return new Date().toISOString();
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
}

module.exports = Logger;
