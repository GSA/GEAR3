class JobLogger {
    constructor() {
        this.logs = '';
    }

    log(message) {
        this.logs += message + '\n'; // Append log to the string with a newline
    }

    getLogs() {
        return this.logs;
    }
}

module.exports = {
    JobLogger,
};