import type { ChatMessage, FileMetadata, MidiLogEntry, FileChunk } from './types';
interface OfflineOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    store: string;
    data: any;
    timestamp: number;
}
declare class IndexedDBStorage {
    private db;
    private dbPromise;
    private openDB;
    private getStore;
    createMidiLog(log: Omit<MidiLogEntry, 'id'>): Promise<string>;
    getMidiLogs(limit?: number, offset?: number): Promise<MidiLogEntry[]>;
    getMidiLogsByUser(userId: string): Promise<MidiLogEntry[]>;
    updateMidiLog(id: string, updates: Partial<MidiLogEntry>): Promise<void>;
    deleteMidiLog(id: string): Promise<void>;
    createChatMessage(message: Omit<ChatMessage, 'id'>): Promise<string>;
    getChatHistory(limit?: number, offset?: number): Promise<ChatMessage[]>;
    getChatHistoryByUser(userId: string): Promise<ChatMessage[]>;
    updateChatMessage(id: string, updates: Partial<ChatMessage>): Promise<void>;
    deleteChatMessage(id: string): Promise<void>;
    createSharedFile(file: Omit<FileMetadata, 'id'>): Promise<string>;
    getSharedFiles(limit?: number, offset?: number): Promise<FileMetadata[]>;
    getSharedFileById(id: string): Promise<FileMetadata | null>;
    updateSharedFile(id: string, updates: Partial<FileMetadata>): Promise<void>;
    deleteSharedFile(id: string): Promise<void>;
    queueOfflineOperation(operation: OfflineOperation): Promise<void>;
    getOfflineOperations(): Promise<OfflineOperation[]>;
    removeOfflineOperation(id: string): Promise<void>;
    storeFileChunk(chunk: FileChunk): Promise<string>;
    getFileChunks(fileId: string): Promise<FileChunk[]>;
    deleteFileChunks(fileId: string): Promise<void>;
    clearAllData(): Promise<void>;
    close(): Promise<void>;
}
export declare const storage: IndexedDBStorage;
export declare function isIndexedDBAvailable(): boolean;
export {};
//# sourceMappingURL=storage.d.ts.map