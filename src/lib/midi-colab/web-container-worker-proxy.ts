import type { ContainerInput, ContainerOutput, ScriptConfig, FileUploadRequest, FileDownloadRequest, FileTransferResult } from './types';

/**
 * Proxy class for communicating with the WebContainer Worker.
 * 
 * The WebContainerWorkerProxy abstracts the complexity of messaging with a Web Worker.
 * It provides a Promise-based API for all worker operations, including starting the engine,
 * loading scripts, processing data, and handling file transfers.
 */
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

  /**
   * Starts the WebContainer engine within the worker.
   */
  async start(): Promise<void> {
    await this.sendMessage('start');
  }

  /**
   * Loads a script into the worker's WebContainer.
   */
  async loadScript(config: ScriptConfig): Promise<void> {
    await this.sendMessage('loadScript', config);
  }

  /**
   * Sends data to be processed by the worker's WebContainer.
   */
  async process(input: ContainerInput): Promise<ContainerOutput> {
    return this.sendMessage('process', input);
  }

  /**
   * Initiates a file upload to the worker.
   */
  async uploadFile(request: FileUploadRequest): Promise<FileTransferResult> {
    return this.sendMessage('uploadFile', request);
  }

  /**
   * Requests a file download from the worker.
   */
  async downloadFile(request: FileDownloadRequest): Promise<FileTransferResult> {
    return this.sendMessage('downloadFile', request);
  }

  /**
   * Stores a file chunk in the worker.
   */
  async storeChunk(chunk: any): Promise<FileTransferResult> {
    return this.sendMessage('storeChunk', chunk);
  }

  /**
   * Retrieves a file chunk from the worker.
   */
  async retrieveChunk(data: { fileId: string; chunkIndex: number }): Promise<any> {
    return this.sendMessage('retrieveChunk', data);
  }

  /**
   * Terminates the worker and cleans up.
   */
  async dispose(): Promise<void> {
    await this.sendMessage('dispose');
    this.worker.terminate();
  }
}