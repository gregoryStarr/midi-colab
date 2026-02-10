import type { ChatMessage, FileMetadata, MidiLogEntry, FileChunk } from './types';

const DB_NAME = 'MidiColabStorage';
const DB_VERSION = 1;

const STORES = {
  MIDI_LOGS: 'midi_logs',
  CHAT_HISTORY: 'chat_history',
  SHARED_FILES: 'shared_files',
  FILE_CHUNKS: 'file_chunks',
  OFFLINE_QUEUE: 'offline_queue'
} as const;

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  store: string;
  data: any;
  timestamp: number;
}

interface StoredFileChunk extends FileChunk {
  id: string;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // MIDI Logs store
        if (!db.objectStoreNames.contains(STORES.MIDI_LOGS)) {
          const midiLogsStore = db.createObjectStore(STORES.MIDI_LOGS, { keyPath: 'id' });
          midiLogsStore.createIndex('userId', 'userId', { unique: false });
          midiLogsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Chat History store
        if (!db.objectStoreNames.contains(STORES.CHAT_HISTORY)) {
          const chatStore = db.createObjectStore(STORES.CHAT_HISTORY, { keyPath: 'id' });
          chatStore.createIndex('userId', 'userId', { unique: false });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
          chatStore.createIndex('type', 'type', { unique: false });
        }

        // Shared Files store
        if (!db.objectStoreNames.contains(STORES.SHARED_FILES)) {
          const filesStore = db.createObjectStore(STORES.SHARED_FILES, { keyPath: 'id' });
          filesStore.createIndex('uploadedBy', 'uploadedBy', { unique: false });
          filesStore.createIndex('timestamp', 'timestamp', { unique: false });
          filesStore.createIndex('type', 'type', { unique: false });
        }

        // File Chunks store
        if (!db.objectStoreNames.contains(STORES.FILE_CHUNKS)) {
          const chunksStore = db.createObjectStore(STORES.FILE_CHUNKS, { keyPath: 'id' });
          chunksStore.createIndex('fileId', 'fileId', { unique: false });
          chunksStore.createIndex('chunkIndex', 'chunkIndex', { unique: false });
        }

        // Offline Queue store
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    this.db = await this.dbPromise;
    return this.db;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // MIDI Logs CRUD
  async createMidiLog(log: Omit<MidiLogEntry, 'id'>): Promise<string> {
    const id = `midi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logEntry: MidiLogEntry = { ...log, id };

    const store = await this.getStore(STORES.MIDI_LOGS, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.add(logEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return id;
  }

  async getMidiLogs(limit = 100, offset = 0): Promise<MidiLogEntry[]> {
    const store = await this.getStore(STORES.MIDI_LOGS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const logs = request.result as MidiLogEntry[];
        resolve(logs.slice(offset, offset + limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMidiLogsByUser(userId: string): Promise<MidiLogEntry[]> {
    const store = await this.getStore(STORES.MIDI_LOGS);
    return new Promise((resolve, reject) => {
      const index = store.index('userId');
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result as MidiLogEntry[]);
      request.onerror = () => reject(request.error);
    });
  }

  async updateMidiLog(id: string, updates: Partial<MidiLogEntry>): Promise<void> {
    const store = await this.getStore(STORES.MIDI_LOGS, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('MIDI log not found'));
          return;
        }
        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteMidiLog(id: string): Promise<void> {
    const store = await this.getStore(STORES.MIDI_LOGS, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Chat History CRUD
  async createChatMessage(message: Omit<ChatMessage, 'id'>): Promise<string> {
    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chatMessage: ChatMessage = { ...message, id };

    const store = await this.getStore(STORES.CHAT_HISTORY, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.add(chatMessage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return id;
  }

  async getChatHistory(limit = 100, offset = 0): Promise<ChatMessage[]> {
    const store = await this.getStore(STORES.CHAT_HISTORY);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const messages = request.result as ChatMessage[];
        // Sort by timestamp descending (newest first)
        messages.sort((a, b) => b.timestamp - a.timestamp);
        resolve(messages.slice(offset, offset + limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getChatHistoryByUser(userId: string): Promise<ChatMessage[]> {
    const store = await this.getStore(STORES.CHAT_HISTORY);
    return new Promise((resolve, reject) => {
      const index = store.index('userId');
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result as ChatMessage[]);
      request.onerror = () => reject(request.error);
    });
  }

  async updateChatMessage(id: string, updates: Partial<ChatMessage>): Promise<void> {
    const store = await this.getStore(STORES.CHAT_HISTORY, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Chat message not found'));
          return;
        }
        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteChatMessage(id: string): Promise<void> {
    const store = await this.getStore(STORES.CHAT_HISTORY, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Shared Files CRUD
  async createSharedFile(file: Omit<FileMetadata, 'id'>): Promise<string> {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileEntry: FileMetadata = { ...file, id };

    const store = await this.getStore(STORES.SHARED_FILES, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.add(fileEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return id;
  }

  async getSharedFiles(limit = 50, offset = 0): Promise<FileMetadata[]> {
    const store = await this.getStore(STORES.SHARED_FILES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const files = request.result as FileMetadata[];
        // Sort by timestamp descending (newest first)
        files.sort((a, b) => b.timestamp - a.timestamp);
        resolve(files.slice(offset, offset + limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSharedFileById(id: string): Promise<FileMetadata | null> {
    const store = await this.getStore(STORES.SHARED_FILES);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSharedFile(id: string, updates: Partial<FileMetadata>): Promise<void> {
    const store = await this.getStore(STORES.SHARED_FILES, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Shared file not found'));
          return;
        }
        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteSharedFile(id: string): Promise<void> {
    const store = await this.getStore(STORES.SHARED_FILES, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Offline Queue Operations
  async queueOfflineOperation(operation: OfflineOperation): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.add(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineOperations(): Promise<OfflineOperation[]> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const operations = request.result as OfflineOperation[];
        // Sort by timestamp ascending (oldest first)
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineOperation(id: string): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // File Chunk CRUD
  async storeFileChunk(chunk: FileChunk): Promise<string> {
    const id = `chunk_${chunk.fileId}_${chunk.chunkIndex}`;
    const storedChunk: StoredFileChunk = { ...chunk, id };

    const store = await this.getStore(STORES.FILE_CHUNKS, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.add(storedChunk);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return id;
  }

  async getFileChunks(fileId: string): Promise<FileChunk[]> {
    const store = await this.getStore(STORES.FILE_CHUNKS);
    return new Promise((resolve, reject) => {
      const index = store.index('fileId');
      const request = index.getAll(fileId);
      request.onsuccess = () => resolve(request.result as FileChunk[]);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFileChunks(fileId: string): Promise<void> {
    const store = await this.getStore(STORES.FILE_CHUNKS, 'readwrite');
    const chunks = await this.getFileChunks(fileId);

    for (const chunk of chunks) {
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(`chunk_${fileId}_${chunk.chunkIndex}`);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.openDB();
    const stores = [STORES.MIDI_LOGS, STORES.CHAT_HISTORY, STORES.SHARED_FILES, STORES.FILE_CHUNKS, STORES.OFFLINE_QUEUE];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
}

// Singleton instance
export const storage = new IndexedDBStorage();

// Helper function to check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.indexedDB !== 'undefined';
}