const util = require('util');

class Logger {
    constructor(moduleName) {
        this.moduleName = moduleName ? `[${moduleName}] ` : '';
    }

    info(message, meta = '') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [INFO] ${this.moduleName}${message} ${meta ? util.inspect(meta) : ''}`);
    }

    error(message, meta = '') {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] ${this.moduleName}${message} ${meta ? util.inspect(meta) : ''}`);
    }

    warn(message, meta = '') {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] ${this.moduleName}${message} ${meta ? util.inspect(meta) : ''}`);
    }

    debug(message, meta = '') {
        if (process.env.NODE_ENV !== 'production') {
            const timestamp = new Date().toISOString();
            console.debug(`[${timestamp}] [DEBUG] ${this.moduleName}${message} ${meta ? util.inspect(meta) : ''}`);
        }
    }
}

// Export a singleton instance or factory for specific modules
module.exports = new Logger();
