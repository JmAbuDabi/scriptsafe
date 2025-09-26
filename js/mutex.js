export default class Mutex {
    constructor() {
        this._locked = false;
        this._queue = [];
    }
    lock() {
        return new Promise(resolve => {
            if (this._locked) {
                this._queue.push(resolve);
            } else {
                this._locked = true;
                resolve();
            }
        });
    }
    unlock() {
        if (this._queue.length > 0) {
            const next = this._queue.shift();
            next();
        } else {
            this._locked = false;
        }
    }
    async withLock(handler) {
        await this.lock();
        try {
            return await handler();
        } finally {
            this.unlock();
        }
    }
}