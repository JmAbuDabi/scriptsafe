const MAX_RULE_ID = Number.MAX_SAFE_INTEGER;

export default class RuleIdGenerator {
  constructor(initialValue = 0) {
    this._lastId = initialValue;
    this._locked = false;
    this._queue = [];
  }

  async next() {
    if (this._locked) {
      return new Promise(resolve => this._queue.push(resolve));
    }

    this._locked = true;

    this._lastId++;
    if (this._lastId > MAX_RULE_ID) {
      this._lastId = 1;
    }

    const id = this._lastId;

    this._locked = false;

    if (this._queue.length > 0) {
      const nextResolve = this._queue.shift();
      nextResolve();
    }

    return id;
  }
}
