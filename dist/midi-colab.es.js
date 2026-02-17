import * as f from "yjs";
import { WebsocketProvider as m } from "y-websocket";
import { WebMidi as p } from "webmidi";
import { WebContainer as y } from "@webcontainer/api";
const S = "MidiColabStorage", I = 1, a = {
  MIDI_LOGS: "midi_logs",
  CHAT_HISTORY: "chat_history",
  SHARED_FILES: "shared_files",
  FILE_CHUNKS: "file_chunks",
  OFFLINE_QUEUE: "offline_queue"
};
class b {
  constructor() {
    this.db = null, this.dbPromise = null;
  }
  /**
   * Opens a connection to the IndexedDB database.
   * Handles database versioning and object store creation.
   * 
   * @returns A promise that resolves to the IDBDatabase instance.
   */
  async openDB() {
    return this.db ? this.db : this.dbPromise ? this.dbPromise : (this.dbPromise = new Promise((e, t) => {
      const r = indexedDB.open(S, I);
      r.onerror = () => t(r.error), r.onsuccess = () => {
        this.db = r.result, e(r.result);
      }, r.onupgradeneeded = (i) => {
        const n = i.target.result;
        if (!n.objectStoreNames.contains(a.MIDI_LOGS)) {
          const s = n.createObjectStore(a.MIDI_LOGS, { keyPath: "id" });
          s.createIndex("userId", "userId", { unique: !1 }), s.createIndex("timestamp", "timestamp", { unique: !1 });
        }
        if (!n.objectStoreNames.contains(a.CHAT_HISTORY)) {
          const s = n.createObjectStore(a.CHAT_HISTORY, { keyPath: "id" });
          s.createIndex("userId", "userId", { unique: !1 }), s.createIndex("timestamp", "timestamp", { unique: !1 }), s.createIndex("type", "type", { unique: !1 });
        }
        if (!n.objectStoreNames.contains(a.SHARED_FILES)) {
          const s = n.createObjectStore(a.SHARED_FILES, { keyPath: "id" });
          s.createIndex("uploadedBy", "uploadedBy", { unique: !1 }), s.createIndex("timestamp", "timestamp", { unique: !1 }), s.createIndex("type", "type", { unique: !1 });
        }
        if (!n.objectStoreNames.contains(a.FILE_CHUNKS)) {
          const s = n.createObjectStore(a.FILE_CHUNKS, { keyPath: "id" });
          s.createIndex("fileId", "fileId", { unique: !1 }), s.createIndex("chunkIndex", "chunkIndex", { unique: !1 });
        }
        n.objectStoreNames.contains(a.OFFLINE_QUEUE) || n.createObjectStore(a.OFFLINE_QUEUE, { keyPath: "id" }).createIndex("timestamp", "timestamp", { unique: !1 });
      };
    }), this.db = await this.dbPromise, this.db);
  }
  /**
   * Helper method to get an object store transaction.
   * 
   * @param storeName The name of the object store.
   * @param mode The transaction mode ('readonly' or 'readwrite').
   * @returns A promise resolving to the IDBObjectStore.
   */
  async getStore(e, t = "readonly") {
    return (await this.openDB()).transaction([e], t).objectStore(e);
  }
  // MIDI Logs CRUD
  /**
   * Stores a new MIDI log entry.
   * 
   * @param log The MIDI log data (without ID).
   * @returns The generated ID of the new log entry.
   */
  async createMidiLog(e) {
    const t = `midi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, r = { ...e, id: t }, i = await this.getStore(a.MIDI_LOGS, "readwrite");
    return await new Promise((n, s) => {
      const o = i.add(r);
      o.onsuccess = () => n(), o.onerror = () => s(o.error);
    }), t;
  }
  /**
   * Retrieves a paginated list of MIDI logs.
   * 
   * @param limit The maximum number of logs to return.
   * @param offset The starting offset.
   */
  async getMidiLogs(e = 100, t = 0) {
    const r = await this.getStore(a.MIDI_LOGS);
    return new Promise((i, n) => {
      const s = r.getAll();
      s.onsuccess = () => {
        const o = s.result;
        i(o.slice(t, t + e));
      }, s.onerror = () => n(s.error);
    });
  }
  /**
   * Retrieves MIDI logs for a specific user.
   * 
   * @param userId The ID of the user to filter logs by.
   * @returns A promise resolving to an array of MIDI log entries.
   */
  async getMidiLogsByUser(e) {
    const t = await this.getStore(a.MIDI_LOGS);
    return new Promise((r, i) => {
      const s = t.index("userId").getAll(e);
      s.onsuccess = () => r(s.result), s.onerror = () => i(s.error);
    });
  }
  /**
   * Updates an existing MIDI log entry.
   * 
   * @param id The ID of the log entry to update.
   * @param updates Partial log entry data to apply.
   * @returns A promise that resolves when the update is complete.
   */
  async updateMidiLog(e, t) {
    const r = await this.getStore(a.MIDI_LOGS, "readwrite");
    return new Promise((i, n) => {
      const s = r.get(e);
      s.onsuccess = () => {
        const o = s.result;
        if (!o) {
          n(new Error("MIDI log not found"));
          return;
        }
        const d = { ...o, ...t }, c = r.put(d);
        c.onsuccess = () => i(), c.onerror = () => n(c.error);
      }, s.onerror = () => n(s.error);
    });
  }
  /**
   * Deletes a MIDI log entry.
   * 
   * @param id The ID of the log entry to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteMidiLog(e) {
    const t = await this.getStore(a.MIDI_LOGS, "readwrite");
    await new Promise((r, i) => {
      const n = t.delete(e);
      n.onsuccess = () => r(), n.onerror = () => i(n.error);
    });
  }
  // Chat History CRUD
  /**
   * Stores a new chat message.
   * 
   * @param message The chat message data (without ID).
   * @returns The generated ID of the new message.
   */
  async createChatMessage(e) {
    const t = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, r = { ...e, id: t }, i = await this.getStore(a.CHAT_HISTORY, "readwrite");
    return await new Promise((n, s) => {
      const o = i.add(r);
      o.onsuccess = () => n(), o.onerror = () => s(o.error);
    }), t;
  }
  /**
   * Retrieves chat history with pagination, sorted by timestamp descending.
   * 
   * @param limit The maximum number of messages to return.
   * @param offset The starting offset.
   */
  async getChatHistory(e = 100, t = 0) {
    const r = await this.getStore(a.CHAT_HISTORY);
    return new Promise((i, n) => {
      const s = r.getAll();
      s.onsuccess = () => {
        const o = s.result;
        o.sort((d, c) => c.timestamp - d.timestamp), i(o.slice(t, t + e));
      }, s.onerror = () => n(s.error);
    });
  }
  /**
   * Retrieves chat history for a specific user.
   * 
   * @param userId The ID of the user to retrieve messages for.
   * @returns A promise resolving to an array of chat messages.
   */
  async getChatHistoryByUser(e) {
    const t = await this.getStore(a.CHAT_HISTORY);
    return new Promise((r, i) => {
      const s = t.index("userId").getAll(e);
      s.onsuccess = () => r(s.result), s.onerror = () => i(s.error);
    });
  }
  /**
   * Updates an existing chat message.
   * 
   * @param id The ID of the message to update.
   * @param updates Partial message data to apply.
   * @returns A promise that resolves when the update is complete.
   */
  async updateChatMessage(e, t) {
    const r = await this.getStore(a.CHAT_HISTORY, "readwrite");
    return new Promise((i, n) => {
      const s = r.get(e);
      s.onsuccess = () => {
        const o = s.result;
        if (!o) {
          n(new Error("Chat message not found"));
          return;
        }
        const d = { ...o, ...t }, c = r.put(d);
        c.onsuccess = () => i(), c.onerror = () => n(c.error);
      }, s.onerror = () => n(s.error);
    });
  }
  /**
   * Deletes a chat message.
   * 
   * @param id The ID of the message to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteChatMessage(e) {
    const t = await this.getStore(a.CHAT_HISTORY, "readwrite");
    await new Promise((r, i) => {
      const n = t.delete(e);
      n.onsuccess = () => r(), n.onerror = () => i(n.error);
    });
  }
  // Shared Files CRUD
  /**
   * Stores metadata for a shared file.
   * 
   * @param file The file metadata (without ID).
   * @returns The generated ID of the file entry.
   */
  async createSharedFile(e) {
    const t = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, r = { ...e, id: t }, i = await this.getStore(a.SHARED_FILES, "readwrite");
    return await new Promise((n, s) => {
      const o = i.add(r);
      o.onsuccess = () => n(), o.onerror = () => s(o.error);
    }), t;
  }
  /**
   * Retrieves a list of shared files, sorted by newest first.
   */
  async getSharedFiles(e = 50, t = 0) {
    const r = await this.getStore(a.SHARED_FILES);
    return new Promise((i, n) => {
      const s = r.getAll();
      s.onsuccess = () => {
        const o = s.result;
        o.sort((d, c) => c.timestamp - d.timestamp), i(o.slice(t, t + e));
      }, s.onerror = () => n(s.error);
    });
  }
  /**
   * Retrieves a single shared file by ID.
   * 
   * @param id The ID of the file to retrieve.
   * @returns A promise resolving to the file metadata or null if not found.
   */
  async getSharedFileById(e) {
    const t = await this.getStore(a.SHARED_FILES);
    return new Promise((r, i) => {
      const n = t.get(e);
      n.onsuccess = () => r(n.result || null), n.onerror = () => i(n.error);
    });
  }
  /**
   * Updates an existing shared file's metadata.
   * 
   * @param id The ID of the file to update.
   * @param updates Partial file metadata to apply.
   * @returns A promise that resolves when the update is complete.
   */
  async updateSharedFile(e, t) {
    const r = await this.getStore(a.SHARED_FILES, "readwrite");
    return new Promise((i, n) => {
      const s = r.get(e);
      s.onsuccess = () => {
        const o = s.result;
        if (!o) {
          n(new Error("Shared file not found"));
          return;
        }
        const d = { ...o, ...t }, c = r.put(d);
        c.onsuccess = () => i(), c.onerror = () => n(c.error);
      }, s.onerror = () => n(s.error);
    });
  }
  /**
   * Deletes a shared file entry.
   * 
   * @param id The ID of the file to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteSharedFile(e) {
    const t = await this.getStore(a.SHARED_FILES, "readwrite");
    await new Promise((r, i) => {
      const n = t.delete(e);
      n.onsuccess = () => r(), n.onerror = () => i(n.error);
    });
  }
  // Offline Queue Operations
  /**
   * Queues an operation to be performed later (when back online).
   * 
   * @param operation The offline operation details.
   */
  async queueOfflineOperation(e) {
    const t = await this.getStore(a.OFFLINE_QUEUE, "readwrite");
    await new Promise((r, i) => {
      const n = t.add(e);
      n.onsuccess = () => r(), n.onerror = () => i(n.error);
    });
  }
  /**
   * Retrieves all queued offline operations, sorted by oldest first.
   */
  async getOfflineOperations() {
    const e = await this.getStore(a.OFFLINE_QUEUE);
    return new Promise((t, r) => {
      const i = e.getAll();
      i.onsuccess = () => {
        const n = i.result;
        n.sort((s, o) => s.timestamp - o.timestamp), t(n);
      }, i.onerror = () => r(i.error);
    });
  }
  /**
   * Removes an operation from the offline queue.
   * 
   * @param id The ID of the offline operation to remove.
   * @returns A promise that resolves when the removal is complete.
   */
  async removeOfflineOperation(e) {
    const t = await this.getStore(a.OFFLINE_QUEUE, "readwrite");
    await new Promise((r, i) => {
      const n = t.delete(e);
      n.onsuccess = () => r(), n.onerror = () => i(n.error);
    });
  }
  // File Chunk CRUD
  /**
   * Stores a binary chunk of a file.
   * 
   * @param chunk The file chunk data.
   * @returns The generated ID of the chunk entry.
   */
  async storeFileChunk(e) {
    const t = `chunk_${e.fileId}_${e.chunkIndex}`, r = { ...e, id: t }, i = await this.getStore(a.FILE_CHUNKS, "readwrite");
    return await new Promise((n, s) => {
      const o = i.add(r);
      o.onsuccess = () => n(), o.onerror = () => s(o.error);
    }), t;
  }
  /**
   * Retrieves all chunks for a specific file.
   * 
   * @param fileId The ID of the file.
   */
  async getFileChunks(e) {
    const t = await this.getStore(a.FILE_CHUNKS);
    return new Promise((r, i) => {
      const s = t.index("fileId").getAll(e);
      s.onsuccess = () => r(s.result), s.onerror = () => i(s.error);
    });
  }
  /**
   * Deletes all file chunks for a given file.
   * 
   * @param fileId The ID of the file to delete chunks for.
   * @returns A promise that resolves when all chunks are deleted.
   */
  async deleteFileChunks(e) {
    const t = await this.getStore(a.FILE_CHUNKS, "readwrite"), r = await this.getFileChunks(e);
    for (const i of r)
      await new Promise((n, s) => {
        const o = t.delete(`chunk_${e}_${i.chunkIndex}`);
        o.onsuccess = () => n(), o.onerror = () => s(o.error);
      });
  }
  // Utility methods
  /**
   * Clears all data from all object stores.
   * Used for resetting the application state.
   */
  async clearAllData() {
    const e = await this.openDB(), t = [a.MIDI_LOGS, a.CHAT_HISTORY, a.SHARED_FILES, a.FILE_CHUNKS, a.OFFLINE_QUEUE];
    for (const r of t) {
      const n = e.transaction([r], "readwrite").objectStore(r);
      await new Promise((s, o) => {
        const d = n.clear();
        d.onsuccess = () => s(), d.onerror = () => o(d.error);
      });
    }
  }
  /**
   * Closes the database connection.
   */
  async close() {
    this.db && (this.db.close(), this.db = null, this.dbPromise = null);
  }
}
const l = new b();
function h() {
  return typeof window < "u" && typeof window.indexedDB < "u";
}
class M {
  constructor(e, t) {
    this.wsUrl = e, this.engine = t, this.provider = null, this.ydoc = new f.Doc(), this.logs = this.ydoc.getArray("logs"), this.messages = this.ydoc.getArray("messages"), this.fileMetadata = this.ydoc.getMap("files"), this.isOnline = !1;
  }
  /**
   * Connects to the WebSocket server and initializes the synchronization provider.
   * Sets up connection status listeners and triggers the processing of the offline queue
   * upon successful connection.
   */
  async connect() {
    this.provider || (this.provider = new m(this.wsUrl, "midi-collab-room", this.ydoc), this.provider.on("status", async (e) => {
      console.log("Yjs connection status:", e.status), this.isOnline = e.status === "connected", this.isOnline && h() && await this.processOfflineQueue();
    }));
  }
  /**
   * Disconnects from the WebSocket server and destroys the provider.
   */
  disconnect() {
    this.isOnline = !1, this.provider?.destroy(), this.provider = null;
  }
  /**
   * Returns the underlying Yjs WebsocketProvider instance.
   */
  getProvider() {
    return this.provider;
  }
  /**
   * Subscribes to remote MIDI events.
   * Monitors the Yjs awareness state for changes in 'currentMidi' from other clients.
   * 
   * @param callback Function to execute when a remote MIDI event is received.
   * @returns A cleanup function to unsubscribe.
   */
  onMidiEvent(e) {
    if (!this.provider) return () => {
    };
    const t = this.provider.awareness, r = (i) => {
      t.getStates().forEach((s, o) => {
        s && s.currentMidi && o !== t.clientID && e(s.currentMidi, o);
      });
    };
    return t.on("change", r), () => t.off("change", r);
  }
  /**
   * Updates the local user's presence state in the awareness protocol.
   * 
   * @param user The user object to set as the local state.
   */
  setLocalUser(e) {
    this.provider && this.provider.awareness.setLocalState(e);
  }
  /**
   * Retrieves a list of all currently online users from the awareness state.
   */
  getOnlineUsers() {
    return this.provider ? Array.from(this.provider.awareness.getStates().values()).filter(
      (e) => !!(e && typeof e == "object" && "id" in e)
    ) : [];
  }
  /**
   * Subscribes to changes in the list of online users.
   * 
   * @param cb Callback function to execute when presence changes.
   * @returns A cleanup function to unsubscribe.
   */
  onPresenceChange(e) {
    if (!this.provider) return;
    const t = () => e(this.getOnlineUsers());
    return this.provider.awareness.on("change", t), t(), () => this.provider.awareness.off("change", t);
  }
  /**
   * Broadcasts raw MIDI input to other clients.
   * Uses a Yjs map with short-lived keys to emit events.
   * 
   * @param input The container input to broadcast.
   */
  broadcastRaw(e) {
    if (this.provider) {
      const t = this.ydoc.getMap("broadcast"), i = `${this.provider.awareness.clientID || "unknown"}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log("NetworkClient: broadcasting MIDI via map with key:", i, "data:", e), t.set(i, e);
    } else
      console.log("NetworkClient: no provider, cannot broadcast");
  }
  /**
   * Processes input via the WebContainerEngine and then broadcasts the result.
   * 
   * @param input The container input to process.
   * @throws Error if the engine is not initialized.
   */
  async broadcastProcessed(e) {
    if (!this.engine) throw new Error("Engine required for processing");
    const t = await this.engine.process(e);
    return this.broadcastRaw(t), t;
  }
  /**
   * Returns the shared 'broadcast' map from the Yjs document.
   */
  getLogs() {
    return this.ydoc.getMap("broadcast");
  }
  /**
   * Pipes input directly to the WebContainerEngine without broadcasting.
   * 
   * @param input The container input to process.
   */
  pipeToContainer(e) {
    return this.engine ? this.engine.process(e) : Promise.resolve({});
  }
  /**
   * Sends a chat message.
   * Appends the message to the shared 'messages' array.
   * 
   * @param message The content of the message.
   */
  sendMessage(e) {
    const t = this.provider?.awareness.getLocalState();
    if (t) {
      const r = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: t.id,
        userName: t.name,
        content: e,
        timestamp: Date.now(),
        type: "message"
      };
      this.messages.push([r]);
    }
  }
  /**
   * Subscribes to updates in the chat message history.
   * 
   * @param cb Callback function to execute when messages change.
   * @returns A cleanup function to unsubscribe.
   */
  onMessage(e) {
    const t = () => e(this.messages.toArray());
    return this.messages.observe(t), t(), () => this.messages.unobserve(t);
  }
  /**
   * Shares file metadata with other clients.
   * Updates the shared 'files' map.
   * 
   * @param metadata The metadata of the file to share.
   */
  shareFile(e) {
    this.fileMetadata.set(e.id, e);
  }
  /**
   * Subscribes to updates in the shared file list.
   * 
   * @param cb Callback function to execute when shared files change.
   * @returns A cleanup function to unsubscribe.
   */
  onFileShared(e) {
    const t = () => e(new Map(Array.from(this.fileMetadata.entries())));
    return this.fileMetadata.observe(t), t(), () => this.fileMetadata.unobserve(t);
  }
  // Offline-first methods
  /**
   * Processes queued offline operations by attempting to sync them with the server.
   * This is called when the client comes back online.
   */
  async processOfflineQueue() {
    if (h())
      try {
        const e = await l.getOfflineOperations();
        for (const t of e)
          try {
            switch (t.type) {
              case "create":
                await this.syncCreateOperation(t);
                break;
              case "update":
                await this.syncUpdateOperation(t);
                break;
              case "delete":
                await this.syncDeleteOperation(t);
                break;
            }
            await l.removeOfflineOperation(t.id);
          } catch (r) {
            console.error("Failed to sync offline operation:", t, r);
          }
      } catch (e) {
        console.error("Failed to process offline queue:", e);
      }
  }
  async syncCreateOperation(e) {
    switch (e.store) {
      case "midi_logs":
        this.logs.push([e.data]);
        break;
      case "chat_history":
        this.messages.push([e.data]);
        break;
      case "shared_files":
        this.fileMetadata.set(e.data.id, e.data);
        break;
    }
  }
  async syncUpdateOperation(e) {
    switch (e.store) {
      case "midi_logs":
        const r = this.logs.toArray().findIndex((s) => s.id === e.data.id);
        r >= 0 && (this.logs.delete(r, 1), this.logs.insert(r, [e.data]));
        break;
      case "chat_history":
        const n = this.messages.toArray().findIndex((s) => s.id === e.data.id);
        n >= 0 && (this.messages.delete(n, 1), this.messages.insert(n, [e.data]));
        break;
      case "shared_files":
        this.fileMetadata.set(e.data.id, e.data);
        break;
    }
  }
  async syncDeleteOperation(e) {
    switch (e.store) {
      case "midi_logs":
        const r = this.logs.toArray().findIndex((s) => s.id === e.data.id);
        r >= 0 && this.logs.delete(r, 1);
        break;
      case "chat_history":
        const n = this.messages.toArray().findIndex((s) => s.id === e.data.id);
        n >= 0 && this.messages.delete(n, 1);
        break;
      case "shared_files":
        this.fileMetadata.delete(e.data.id);
        break;
    }
  }
  // Queue operations when offline
  async queueOfflineOperation(e, t, r) {
    if (!h()) return;
    const i = {
      id: `${e}_${t}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: e,
      store: t,
      data: r,
      timestamp: Date.now()
    };
    await l.queueOfflineOperation(i);
  }
  // Enhanced methods that work offline-first
  /**
   * Sends a chat message with offline support.
   * If online, behaves like `sendMessage`.
   * If offline, stores the message locally and queues it for sync.
   * 
   * @param message The content of the message.
   */
  async sendMessageOfflineFirst(e) {
    const t = this.provider?.awareness.getLocalState();
    if (!t) return;
    const r = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: t.id,
      userName: t.name,
      content: e,
      timestamp: Date.now(),
      type: "message"
    };
    this.isOnline ? this.messages.push([r]) : (h() && await l.createChatMessage(r), await this.queueOfflineOperation("create", "chat_history", r));
  }
  /**
   * Logs a MIDI event with offline support.
   * 
   * @param event The MIDI log entry to record.
   */
  async logMidiEventOfflineFirst(e) {
    this.isOnline ? this.logs.push([e]) : (h() && await l.createMidiLog(e), await this.queueOfflineOperation("create", "midi_logs", e));
  }
  /**
   * Shares a file via metadata with offline support.
   * 
   * @param metadata The file metadata.
   */
  async shareFileOfflineFirst(e) {
    this.isOnline ? this.fileMetadata.set(e.id, e) : (h() && await l.createSharedFile(e), await this.queueOfflineOperation("create", "shared_files", e));
  }
}
class v {
  constructor() {
    this.inputs = [], this.outputs = [], this.eventCallbacks = [];
  }
  /**
   * Initializes the MIDI subsystem.
   * Requests MIDI access from the browser and sets up event listeners
   * for device connection changes.
   * 
   * @throws Will throw an error if MIDI access is denied or unavailable.
   */
  async init() {
    try {
      await p.enable(), p.addListener("connected", (e) => this.onDeviceConnected(e)), p.addListener("disconnected", (e) => this.onDeviceDisconnected(e)), this.inputs = [...p.inputs], this.outputs = [...p.outputs], this.setupListeners();
    } catch (e) {
      throw console.error("MIDI access denied:", e), e;
    }
  }
  onDeviceConnected(e) {
    e.port.type === "input" ? (this.inputs.push(e.port), this.setupInputListener(e.port)) : e.port.type === "output" && this.outputs.push(e.port);
  }
  onDeviceDisconnected(e) {
    this.inputs = this.inputs.filter((t) => t !== e.port), this.outputs = this.outputs.filter((t) => t !== e.port);
  }
  setupListeners() {
    this.inputs.forEach((e) => this.setupInputListener(e));
  }
  setupInputListener(e) {
    e.addListener("midimessage", (t) => {
      const r = t.message, i = {
        type: this.getMessageType(r.data),
        data: Array.from(r.data),
        timestamp: Date.now(),
        source: e.name || "unknown"
      };
      this.eventCallbacks.forEach((n) => n(i));
    });
  }
  getMessageType(e) {
    switch (e[0] & 240) {
      case 128:
        return "noteoff";
      case 144:
        return "noteon";
      case 176:
        return "cc";
      default:
        return "noteon";
    }
  }
  /**
   * Subscribes to incoming MIDI events from all connected inputs.
   * 
   * @param cb Callback function to be executed when a MIDI event occurs.
   */
  onEvent(e) {
    this.eventCallbacks.push(e);
  }
  /**
   * Unsubscribes from MIDI events.
   * 
   * @param cb The callback function to remove.
   */
  offEvent(e) {
    const t = this.eventCallbacks.indexOf(e);
    t > -1 && this.eventCallbacks.splice(t, 1);
  }
  /**
   * Returns a list of currently connected MIDI input devices.
   */
  getInputs() {
    return this.inputs;
  }
  /**
   * Returns a list of currently connected MIDI output devices.
   */
  getOutputs() {
    return this.outputs;
  }
  /**
   * Selects a specific MIDI input device by name.
   * 
   * @param name The name of the input device.
   * @returns The Input object if found, or null otherwise.
   */
  selectInput(e) {
    return this.inputs.find((t) => t.name === e) || null;
  }
  /**
   * Sends a MIDI event to a specific output device.
   * If no output name is provided, sends to the first available output.
   * 
   * @param event The MIDI event to send.
   * @param outputName Optional name of the output device to target.
   */
  send(e, t) {
    const r = t ? this.outputs.find((i) => i.name === t) : this.outputs[0];
    r && r.send(new Uint8Array(e.data));
  }
  /**
   * Pipes incoming MIDI events to a WebContainerEngine for processing.
   * The processed output can be handled via the optional callback.
   * 
   * @param engine The WebContainerEngine instance.
   * @param cb Optional callback for handling the processed output.
   */
  async pipeToContainer(e, t) {
    this.onEvent(async (r) => {
      const i = { type: "midi", data: r }, n = await e.process(i);
      t?.(n);
    });
  }
}
const u = class u {
  constructor() {
    this.webcontainer = null;
  }
  /**
   * Retrieves the singleton instance of the WebContainerEngine.
   * Checks for an existing instance on the window object to support
   * persistence during development hot reloads.
   * 
   * @returns The WebContainerEngine instance.
   */
  static getInstance() {
    return window.webContainerEngine ? window.webContainerEngine : (u.instance || (u.instance = new u(), window.webContainerEngine = u.instance), u.instance);
  }
  /**
   * Boots the WebContainer and sets up the file system.
   * Installs necessary dependencies (e.g., 'tonal') and marks the engine as started.
   * Prevents multiple boot sequences within the same page session.
   */
  async start() {
    if (window.webContainerStarted) return;
    if (this.webcontainer = await y.boot(), await this.webcontainer.mount({
      "package.json": {
        file: {
          contents: JSON.stringify({
            name: "midi-processor",
            type: "module",
            dependencies: {
              tonal: "^5.0.0"
            }
          }, null, 2)
        }
      },
      scripts: {
        directory: {}
      }
    }), await (await this.webcontainer.spawn("npm", ["install"])).exit !== 0)
      throw new Error("Failed to install dependencies in WebContainer");
    window.webContainerStarted = !0;
  }
  /**
   * Writes a user script to the container's file system.
   * 
   * @param config Configuration containing the script code.
   * @throws Error if the engine has not been started.
   */
  async loadScript(e) {
    if (!this.webcontainer) throw new Error("Engine not started. Call start() first.");
    await this.webcontainer.fs.writeFile("input.js", e.code);
  }
  /**
   * Executes the loaded script with the provided input.
   * Writes input to 'input.json', spawns a Node.js process to run 'input.js',
   * and parses the output from stdout.
   * 
   * @param input The data to process.
   * @returns The processed output or error logs.
   * @throws Error if the engine has not been started.
   */
  async process(e) {
    if (!this.webcontainer) throw new Error("Engine not started. Call start() first.");
    await this.webcontainer.fs.writeFile("input.json", JSON.stringify(e));
    const t = await this.webcontainer.spawn("node", ["input.js"]), r = [], i = [];
    t.output.pipeTo(new WritableStream({
      write(o) {
        r.push(o);
      }
    }));
    const n = await t.exit;
    let s = {};
    if (n === 0)
      try {
        const o = r.join("");
        s = JSON.parse(o);
      } catch {
        s = { logs: r };
      }
    else
      s = { errors: [...i, ...r] };
    return s;
  }
  /**
   * Cleans up resources.
   * Note: The underlying WebContainer instance persists for the page session,
   * so this method primarily clears the internal reference.
   */
  async dispose() {
    this.webcontainer = null;
  }
};
u.instance = null;
let g = u;
class C {
  constructor(e) {
    this.provider = null, this.provider = e.getProvider();
  }
  /**
   * Sets the local user's presence state.
   * 
   * @param user The user object representing the local user.
   */
  setLocalState(e) {
    this.provider && this.provider.awareness.setLocalState(e);
  }
  /**
   * Retrieves a list of currently online users.
   * Filters the raw awareness states to ensure they match the User interface.
   * 
   * @returns An array of User objects.
   */
  getOnlineUsers() {
    return this.provider ? Array.from(this.provider.awareness.getStates().values()).filter(
      (e) => e && typeof e == "object" && e !== null && "id" in e && "name" in e
    ) : [];
  }
  /**
   * Subscribes to presence updates.
   * 
   * @param cb Callback function to execute when the list of online users changes.
   * @returns A cleanup function to unsubscribe.
   */
  onUpdate(e) {
    if (!this.provider) return () => {
    };
    const t = () => e(this.getOnlineUsers());
    return this.provider.awareness.on("change", t), t(), () => this.provider.awareness.off("change", t);
  }
  /**
   * Exports the current presence state for external processing (e.g., in a container).
   * 
   * @returns An object containing the list of users and a timestamp.
   */
  // Export for container processing
  exportToContainer() {
    return { users: this.getOnlineUsers(), timestamp: Date.now() };
  }
}
export {
  v as MidiBridge,
  M as NetworkClient,
  C as PresenceManager,
  g as WebContainerEngine,
  h as isIndexedDBAvailable,
  l as storage
};
