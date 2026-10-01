export class CircuitBreaker {
  constructor({ failureThreshold = 5, resetTimeoutMs = 10000 }) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.failureCount = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  canExecute() {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    if (this.state === 'half-open') return true;
    return true;
  }

  getState() {
    return this.state;
  }
}

export const circuitBreaker = new CircuitBreaker({});

export function fallbackFeedData() {
  return {
    videos: [],
    nextCursor: null,
    degraded: true,
    meta: { degraded: true },
  };
}

export function applyRequestFaults({ simulateSlow, simulateFail }) {
  return {
    slow: Boolean(Number(simulateSlow) === 1),
    fail: Boolean(Number(simulateFail) === 1),
  };
}
