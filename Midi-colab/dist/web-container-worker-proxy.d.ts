import type { ContainerInput, ContainerOutput, ScriptConfig, FileUploadRequest, FileDownloadRequest, FileTransferResult } from './types';
export declare class WebContainerWorkerProxy {
    private worker;
    private messageId;
    private pendingRequests;
    constructor();
    private handleMessage;
    private handleError;
    private sendMessage;
    start(): Promise<void>;
    loadScript(config: ScriptConfig): Promise<void>;
    process(input: ContainerInput): Promise<ContainerOutput>;
    uploadFile(request: FileUploadRequest): Promise<FileTransferResult>;
    downloadFile(request: FileDownloadRequest): Promise<FileTransferResult>;
    storeChunk(chunk: any): Promise<FileTransferResult>;
    retrieveChunk(data: {
        fileId: string;
        chunkIndex: number;
    }): Promise<any>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=web-container-worker-proxy.d.ts.map