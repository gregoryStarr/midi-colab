import type { ContainerInput, ContainerOutput, ScriptConfig, FileUploadRequest, FileDownloadRequest, FileTransferResult } from './types';

export class WebContainerWorkerProxy {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

  constructor() {
    // Create worker from the worker script
    this.worker = new Worker(new URL('./web-container-worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, result, error, id } = event.data;

    if (type === 'response' && id !== undefined) {
      const request = this.pendingRequests.get(id);
      if (request) {
        this.pendingRequests.delete(id);
        request.resolve(result);
      }
    } else if (type === 'error' && id !== undefined) {
      const request = this.pendingRequests.get(id);
      if (request) {
        this.pendingRequests.delete(id);
        request.reject(new Error(error));
      }
    }
  }

  private handleError(error: ErrorEvent) {
    console.error('WebContainerWorker error:', error);
  }

  private async sendMessage(type: string, data?: any): Promise<any> {
    const id = ++this.messageId;
    const message = { type, data, id };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage(message);
    });
  }

  async start(): Promise<void> {
    await this.sendMessage('start');
  }

  async loadScript(config: ScriptConfig): Promise<void> {
    await this.sendMessage('loadScript', config);
  }

  async process(input: ContainerInput): Promise<ContainerOutput> {
    return this.sendMessage('process', input);
  }

  async uploadFile(request: FileUploadRequest): Promise<FileTransferResult> {
    return this.sendMessage('uploadFile', request);
  }

  async downloadFile(request: FileDownloadRequest): Promise<FileTransferResult> {
    return this.sendMessage('downloadFile', request);
  }

  async storeChunk(chunk: any): Promise<FileTransferResult> {
    return this.sendMessage('storeChunk', chunk);
  }

  async retrieveChunk(data: { fileId: string; chunkIndex: number }): Promise<any> {
    return this.sendMessage('retrieveChunk', data);
  }

  async dispose(): Promise<void> {
    await this.sendMessage('dispose');
    this.worker.terminate();
  }
}