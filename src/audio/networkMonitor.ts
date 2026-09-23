type RequestLog = {
  url: string;
  method: string;
  timestamp: string;
  payloadSize: number;
};

class NetworkPrivacyMonitor {
  private requestCount = 0;
  private bytesSent = 0;
  private logs: RequestLog[] = [];
  private listeners: (() => void)[] = [];
  private initialized = false;

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Monitor fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : (input as Request).url;
      const method = init?.method || 'GET';
      const body = init?.body;
      let size = 0;
      if (typeof body === 'string') size = body.length;
      else if (body instanceof Blob) size = body.size;
      else if (body instanceof ArrayBuffer) size = body.byteLength;

      this.recordRequest(url, method, size);
      return originalFetch.apply(window, args);
    };

    // Monitor XHR
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: unknown[]) {
      (this as unknown as { _url: string; _method: string })._url = url.toString();
      (this as unknown as { _url: string; _method: string })._method = method;
      return (originalOpen as unknown as (...args: unknown[]) => void).apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const info = this as unknown as { _url?: string; _method?: string };
      let size = 0;
      if (typeof body === 'string') size = body.length;
      else if (body instanceof Blob) size = body.size;
      else if (body instanceof ArrayBuffer) size = body.byteLength;

      self.recordRequest(info._url || 'unknown', info._method || 'GET', size);
      return originalSend.apply(this, [body]);
    };
  }

  private recordRequest(url: string, method: string, payloadSize: number) {
    this.requestCount++;
    this.bytesSent += payloadSize;
    this.logs.unshift({
      url,
      method,
      timestamp: new Date().toLocaleTimeString(),
      payloadSize,
    });
    if (this.logs.length > 50) this.logs.pop();
    this.notify();
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      bytesSent: this.bytesSent,
      logs: this.logs,
    };
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const networkMonitor = new NetworkPrivacyMonitor();
