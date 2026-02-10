export class WebContainerWorkerProxy {
    constructor() {
        this.messageId = 0;
        this.pendingRequests = new Map();
        // Create worker from the worker script
        this.worker = new Worker(new URL('./web-container-worker.ts', import.meta.url), {
            type: 'module'
        });
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
    }
    handleMessage(event) {
        const { type, result, error, id } = event.data;
        if (type === 'response' && id !== undefined) {
            const request = this.pendingRequests.get(id);
            if (request) {
                this.pendingRequests.delete(id);
                request.resolve(result);
            }
        }
        else if (type === 'error' && id !== undefined) {
            const request = this.pendingRequests.get(id);
            if (request) {
                this.pendingRequests.delete(id);
                request.reject(new Error(error));
            }
        }
    }
    handleError(error) {
        console.error('WebContainerWorker error:', error);
    }
    async sendMessage(type, data) {
        const id = ++this.messageId;
        const message = { type, data, id };
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage(message);
        });
    }
    async start() {
        await this.sendMessage('start');
    }
    async loadScript(config) {
        await this.sendMessage('loadScript', config);
    }
    async process(input) {
        return this.sendMessage('process', input);
    }
    async uploadFile(request) {
        return this.sendMessage('uploadFile', request);
    }
    async downloadFile(request) {
        return this.sendMessage('downloadFile', request);
    }
    async storeChunk(chunk) {
        return this.sendMessage('storeChunk', chunk);
    }
    async retrieveChunk(data) {
        return this.sendMessage('retrieveChunk', data);
    }
    async dispose() {
        await this.sendMessage('dispose');
        this.worker.terminate();
    }
}
//# sourceMappingURL=web-container-worker-proxy.js.map