import * as p from "yjs";
import { WebsocketProvider as w } from "y-websocket";
import { WebMidi as g } from "webmidi";
const f = "MidiColabStorage", m = 1, a = {
  MIDI_LOGS: "midi_logs",
  CHAT_HISTORY: "chat_history",
  SHARED_FILES: "shared_files",
  FILE_CHUNKS: "file_chunks",
  OFFLINE_QUEUE: "offline_queue"
};
class y {
  constructor() {
    this.db = null, this.dbPromise = null;
  }
  async openDB() {
    return this.db ? this.db : this.dbPromise ? this.dbPromise : (this.dbPromise = new Promise((e, t) => {
      const n = indexedDB.open(f, m);
      n.onerror = () => t(n.error), n.onsuccess = () => {
        this.db = n.result, e(n.result);
      }, n.onupgradeneeded = (i) => {
        const s = i.target.result;
        if (!s.objectStoreNames.contains(a.MIDI_LOGS)) {
          const r = s.createObjectStore(a.MIDI_LOGS, { keyPath: "id" });
          r.createIndex("userId", "userId", { unique: !1 }), r.createIndex("timestamp", "timestamp", { unique: !1 });
        }
        if (!s.objectStoreNames.contains(a.CHAT_HISTORY)) {
          const r = s.createObjectStore(a.CHAT_HISTORY, { keyPath: "id" });
          r.createIndex("userId", "userId", { unique: !1 }), r.createIndex("timestamp", "timestamp", { unique: !1 }), r.createIndex("type", "type", { unique: !1 });
        }
        if (!s.objectStoreNames.contains(a.SHARED_FILES)) {
          const r = s.createObjectStore(a.SHARED_FILES, { keyPath: "id" });
          r.createIndex("uploadedBy", "uploadedBy", { unique: !1 }), r.createIndex("timestamp", "timestamp", { unique: !1 }), r.createIndex("type", "type", { unique: !1 });
        }
        if (!s.objectStoreNames.contains(a.FILE_CHUNKS)) {
          const r = s.createObjectStore(a.FILE_CHUNKS, { keyPath: "id" });
          r.createIndex("fileId", "fileId", { unique: !1 }), r.createIndex("chunkIndex", "chunkIndex", { unique: !1 });
        }
        s.objectStoreNames.contains(a.OFFLINE_QUEUE) || s.createObjectStore(a.OFFLINE_QUEUE, { keyPath: "id" }).createIndex("timestamp", "timestamp", { unique: !1 });
      };
    }), this.db = await this.dbPromise, this.db);
  }
  async getStore(e, t = "readonly") {
    return (await this.openDB()).transaction([e], t).objectStore(e);
  }
  // MIDI Logs CRUD
  async createMidiLog(e) {
    const t = `midi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, n = { ...e, id: t }, i = await this.getStore(a.MIDI_LOGS, "readwrite");
    return await new Promise((s, r) => {
      const o = i.add(n);
      o.onsuccess = () => s(), o.onerror = () => r(o.error);
    }), t;
  }
  async getMidiLogs(e = 100, t = 0) {
    const n = await this.getStore(a.MIDI_LOGS);
    return new Promise((i, s) => {
      const r = n.getAll();
      r.onsuccess = () => {
        const o = r.result;
        i(o.slice(t, t + e));
      }, r.onerror = () => s(r.error);
    });
  }
  async getMidiLogsByUser(e) {
    const t = await this.getStore(a.MIDI_LOGS);
    return new Promise((n, i) => {
      const r = t.index("userId").getAll(e);
      r.onsuccess = () => n(r.result), r.onerror = () => i(r.error);
    });
  }
  async updateMidiLog(e, t) {
    const n = await this.getStore(a.MIDI_LOGS, "readwrite");
    return new Promise((i, s) => {
      const r = n.get(e);
      r.onsuccess = () => {
        const o = r.result;
        if (!o) {
          s(new Error("MIDI log not found"));
          return;
        }
        const d = { ...o, ...t }, c = n.put(d);
        c.onsuccess = () => i(), c.onerror = () => s(c.error);
      }, r.onerror = () => s(r.error);
    });
  }
  async deleteMidiLog(e) {
    const t = await this.getStore(a.MIDI_LOGS, "readwrite");
    await new Promise((n, i) => {
      const s = t.delete(e);
      s.onsuccess = () => n(), s.onerror = () => i(s.error);
    });
  }
  // Chat History CRUD
  async createChatMessage(e) {
    const t = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, n = { ...e, id: t }, i = await this.getStore(a.CHAT_HISTORY, "readwrite");
    return await new Promise((s, r) => {
      const o = i.add(n);
      o.onsuccess = () => s(), o.onerror = () => r(o.error);
    }), t;
  }
  async getChatHistory(e = 100, t = 0) {
    const n = await this.getStore(a.CHAT_HISTORY);
    return new Promise((i, s) => {
      const r = n.getAll();
      r.onsuccess = () => {
        const o = r.result;
        o.sort((d, c) => c.timestamp - d.timestamp), i(o.slice(t, t + e));
      }, r.onerror = () => s(r.error);
    });
  }
  async getChatHistoryByUser(e) {
    const t = await this.getStore(a.CHAT_HISTORY);
    return new Promise((n, i) => {
      const r = t.index("userId").getAll(e);
      r.onsuccess = () => n(r.result), r.onerror = () => i(r.error);
    });
  }
  async updateChatMessage(e, t) {
    const n = await this.getStore(a.CHAT_HISTORY, "readwrite");
    return new Promise((i, s) => {
      const r = n.get(e);
      r.onsuccess = () => {
        const o = r.result;
        if (!o) {
          s(new Error("Chat message not found"));
          return;
        }
        const d = { ...o, ...t }, c = n.put(d);
        c.onsuccess = () => i(), c.onerror = () => s(c.error);
      }, r.onerror = () => s(r.error);
    });
  }
  async deleteChatMessage(e) {
    const t = await this.getStore(a.CHAT_HISTORY, "readwrite");
    await new Promise((n, i) => {
      const s = t.delete(e);
      s.onsuccess = () => n(), s.onerror = () => i(s.error);
    });
  }
  // Shared Files CRUD
  async createSharedFile(e) {
    const t = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, n = { ...e, id: t }, i = await this.getStore(a.SHARED_FILES, "readwrite");
    return await new Promise((s, r) => {
      const o = i.add(n);
      o.onsuccess = () => s(), o.onerror = () => r(o.error);
    }), t;
  }
  async getSharedFiles(e = 50, t = 0) {
    const n = await this.getStore(a.SHARED_FILES);
    return new Promise((i, s) => {
      const r = n.getAll();
      r.onsuccess = () => {
        const o = r.result;
        o.sort((d, c) => c.timestamp - d.timestamp), i(o.slice(t, t + e));
      }, r.onerror = () => s(r.error);
    });
  }
  async getSharedFileById(e) {
    const t = await this.getStore(a.SHARED_FILES);
    return new Promise((n, i) => {
      const s = t.get(e);
      s.onsuccess = () => n(s.result || null), s.onerror = () => i(s.error);
    });
  }
  async updateSharedFile(e, t) {
    const n = await this.getStore(a.SHARED_FILES, "readwrite");
    return new Promise((i, s) => {
      const r = n.get(e);
      r.onsuccess = () => {
        const o = r.result;
        if (!o) {
          s(new Error("Shared file not found"));
          return;
        }
        const d = { ...o, ...t }, c = n.put(d);
        c.onsuccess = () => i(), c.onerror = () => s(c.error);
      }, r.onerror = () => s(r.error);
    });
  }
  async deleteSharedFile(e) {
    const t = await this.getStore(a.SHARED_FILES, "readwrite");
    await new Promise((n, i) => {
      const s = t.delete(e);
      s.onsuccess = () => n(), s.onerror = () => i(s.error);
    });
  }
  // Offline Queue Operations
  async queueOfflineOperation(e) {
    const t = await this.getStore(a.OFFLINE_QUEUE, "readwrite");
    await new Promise((n, i) => {
      const s = t.add(e);
      s.onsuccess = () => n(), s.onerror = () => i(s.error);
    });
  }
  async getOfflineOperations() {
    const e = await this.getStore(a.OFFLINE_QUEUE);
    return new Promise((t, n) => {
      const i = e.getAll();
      i.onsuccess = () => {
        const s = i.result;
        s.sort((r, o) => r.timestamp - o.timestamp), t(s);
      }, i.onerror = () => n(i.error);
    });
  }
  async removeOfflineOperation(e) {
    const t = await this.getStore(a.OFFLINE_QUEUE, "readwrite");
    await new Promise((n, i) => {
      const s = t.delete(e);
      s.onsuccess = () => n(), s.onerror = () => i(s.error);
    });
  }
  // File Chunk CRUD
  async storeFileChunk(e) {
    const t = `chunk_${e.fileId}_${e.chunkIndex}`, n = { ...e, id: t }, i = await this.getStore(a.FILE_CHUNKS, "readwrite");
    return await new Promise((s, r) => {
      const o = i.add(n);
      o.onsuccess = () => s(), o.onerror = () => r(o.error);
    }), t;
  }
  async getFileChunks(e) {
    const t = await this.getStore(a.FILE_CHUNKS);
    return new Promise((n, i) => {
      const r = t.index("fileId").getAll(e);
      r.onsuccess = () => n(r.result), r.onerror = () => i(r.error);
    });
  }
  async deleteFileChunks(e) {
    const t = await this.getStore(a.FILE_CHUNKS, "readwrite"), n = await this.getFileChunks(e);
    for (const i of n)
      await new Promise((s, r) => {
        const o = t.delete(`chunk_${e}_${i.chunkIndex}`);
        o.onsuccess = () => s(), o.onerror = () => r(o.error);
      });
  }
  // Utility methods
  async clearAllData() {
    const e = await this.openDB(), t = [a.MIDI_LOGS, a.CHAT_HISTORY, a.SHARED_FILES, a.FILE_CHUNKS, a.OFFLINE_QUEUE];
    for (const n of t) {
      const s = e.transaction([n], "readwrite").objectStore(n);
      await new Promise((r, o) => {
        const d = s.clear();
        d.onsuccess = () => r(), d.onerror = () => o(d.error);
      });
    }
  }
  async close() {
    this.db && (this.db.close(), this.db = null, this.dbPromise = null);
  }
}
const u = new y();
function h() {
  return typeof window < "u" && typeof window.indexedDB < "u";
}
class O {
  constructor(e, t) {
    this.wsUrl = e, this.engine = t, this.provider = null, this.ydoc = new p.Doc(), this.logs = this.ydoc.getArray("logs"), this.messages = this.ydoc.getArray("messages"), this.fileMetadata = this.ydoc.getMap("files"), this.isOnline = !1;
  }
  async connect() {
    this.provider || (this.provider = new w(this.wsUrl, "midi-collab-room", this.ydoc), this.provider.on("status", async (e) => {
      console.log("Yjs connection status:", e.status), this.isOnline = e.status === "connected", this.isOnline && h() && await this.processOfflineQueue();
    }));
  }
  disconnect() {
    this.isOnline = !1, this.provider?.destroy(), this.provider = null;
  }
  setLocalUser(e) {
    this.provider && this.provider.awareness.setLocalState(e);
  }
  getOnlineUsers() {
    return this.provider ? Array.from(this.provider.awareness.getStates().values()).filter(
      (e) => e && typeof e == "object" && "id" in e
    ) : [];
  }
  onPresenceChange(e) {
    if (!this.provider) return;
    const t = () => e(this.getOnlineUsers());
    return this.provider.awareness.on("change", t), t(), () => this.provider.awareness.off("change", t);
  }
  broadcastRaw(e) {
    this.provider && this.ydoc.getMap("broadcast").set(Date.now().toString(), e);
  }
  async broadcastProcessed(e) {
    if (!this.engine) throw new Error("Engine required for processing");
    const t = await this.engine.process(e);
    return this.broadcastRaw(t), t;
  }
  getLogs() {
    return this.logs.toArray();
  }
  pipeToContainer(e) {
    return this.engine ? this.engine.process(e) : Promise.resolve({});
  }
  sendMessage(e) {
    const t = this.provider?.awareness.getLocalState();
    if (t) {
      const n = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: t.id,
        userName: t.name,
        content: e,
        timestamp: Date.now(),
        type: "message"
      };
      this.messages.push([n]);
    }
  }
  onMessage(e) {
    const t = () => e(this.messages.toArray());
    return this.messages.observe(t), t(), () => this.messages.unobserve(t);
  }
  shareFile(e) {
    this.fileMetadata.set(e.id, e);
  }
  onFileShared(e) {
    const t = () => e(new Map(Array.from(this.fileMetadata.entries())));
    return this.fileMetadata.observe(t), t(), () => this.fileMetadata.unobserve(t);
  }
  // Offline-first methods
  async processOfflineQueue() {
    if (h())
      try {
        const e = await u.getOfflineOperations();
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
            await u.removeOfflineOperation(t.id);
          } catch (n) {
            console.error("Failed to sync offline operation:", t, n);
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
        const n = this.logs.toArray().findIndex((r) => r.id === e.data.id);
        n >= 0 && (this.logs.delete(n, 1), this.logs.insert(n, [e.data]));
        break;
      case "chat_history":
        const s = this.messages.toArray().findIndex((r) => r.id === e.data.id);
        s >= 0 && (this.messages.delete(s, 1), this.messages.insert(s, [e.data]));
        break;
      case "shared_files":
        this.fileMetadata.set(e.data.id, e.data);
        break;
    }
  }
  async syncDeleteOperation(e) {
    switch (e.store) {
      case "midi_logs":
        const n = this.logs.toArray().findIndex((r) => r.id === e.data.id);
        n >= 0 && this.logs.delete(n, 1);
        break;
      case "chat_history":
        const s = this.messages.toArray().findIndex((r) => r.id === e.data.id);
        s >= 0 && this.messages.delete(s, 1);
        break;
      case "shared_files":
        this.fileMetadata.delete(e.data.id);
        break;
    }
  }
  // Queue operations when offline
  async queueOfflineOperation(e, t, n) {
    if (!h()) return;
    const i = {
      id: `${e}_${t}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: e,
      store: t,
      data: n,
      timestamp: Date.now()
    };
    await u.queueOfflineOperation(i);
  }
  // Enhanced methods that work offline-first
  async sendMessageOfflineFirst(e) {
    const t = this.provider?.awareness.getLocalState();
    if (!t) return;
    const n = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: t.id,
      userName: t.name,
      content: e,
      timestamp: Date.now(),
      type: "message"
    };
    this.isOnline ? this.messages.push([n]) : (h() && await u.createChatMessage(n), await this.queueOfflineOperation("create", "chat_history", n));
  }
  async logMidiEventOfflineFirst(e) {
    this.isOnline ? this.logs.push([e]) : (h() && await u.createMidiLog(e), await this.queueOfflineOperation("create", "midi_logs", e));
  }
  async shareFileOfflineFirst(e) {
    this.isOnline ? this.fileMetadata.set(e.id, e) : (h() && await u.createSharedFile(e), await this.queueOfflineOperation("create", "shared_files", e));
  }
}
class _ {
  constructor() {
    this.inputs = [], this.outputs = [], this.eventCallbacks = [];
  }
  async init() {
    try {
      await g.enable(), g.addListener("connected", (e) => this.onDeviceConnected(e)), g.addListener("disconnected", (e) => this.onDeviceDisconnected(e)), this.inputs = [...g.inputs], this.outputs = [...g.outputs], this.setupListeners();
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
      const n = t.message, i = {
        type: this.getMessageType(n.data),
        data: Array.from(n.data),
        timestamp: Date.now(),
        source: e.name || "unknown"
      };
      this.eventCallbacks.forEach((s) => s(i));
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
  onEvent(e) {
    this.eventCallbacks.push(e);
  }
  offEvent(e) {
    const t = this.eventCallbacks.indexOf(e);
    t > -1 && this.eventCallbacks.splice(t, 1);
  }
  getInputs() {
    return this.inputs;
  }
  getOutputs() {
    return this.outputs;
  }
  selectInput(e) {
    return this.inputs.find((t) => t.name === e) || null;
  }
  send(e, t) {
    const n = t ? this.outputs.find((i) => i.name === t) : this.outputs[0];
    n && n.send(new Uint8Array(e.data));
  }
  async pipeToContainer(e, t) {
    this.onEvent(async (n) => {
      const i = { type: "midi", data: n }, s = await e.process(i);
      t?.(s);
    });
  }
}
class S {
  constructor() {
    this.messageId = 0, this.pendingRequests = /* @__PURE__ */ new Map(), this.worker = new Worker(new URL(
      /* @vite-ignore */
      "/assets/web-container-worker-BQgvVO2U.js",
      import.meta.url
    ), {
      type: "module"
    }), this.worker.onmessage = this.handleMessage.bind(this), this.worker.onerror = this.handleError.bind(this);
  }
  handleMessage(e) {
    const { type: t, result: n, error: i, id: s } = e.data;
    if (t === "response" && s !== void 0) {
      const r = this.pendingRequests.get(s);
      r && (this.pendingRequests.delete(s), r.resolve(n));
    } else if (t === "error" && s !== void 0) {
      const r = this.pendingRequests.get(s);
      r && (this.pendingRequests.delete(s), r.reject(new Error(i)));
    }
  }
  handleError(e) {
    console.error("WebContainerWorker error:", e);
  }
  async sendMessage(e, t) {
    const n = ++this.messageId, i = { type: e, data: t, id: n };
    return new Promise((s, r) => {
      this.pendingRequests.set(n, { resolve: s, reject: r }), this.worker.postMessage(i);
    });
  }
  async start() {
    await this.sendMessage("start");
  }
  async loadScript(e) {
    await this.sendMessage("loadScript", e);
  }
  async process(e) {
    return this.sendMessage("process", e);
  }
  async uploadFile(e) {
    return this.sendMessage("uploadFile", e);
  }
  async downloadFile(e) {
    return this.sendMessage("downloadFile", e);
  }
  async storeChunk(e) {
    return this.sendMessage("storeChunk", e);
  }
  async retrieveChunk(e) {
    return this.sendMessage("retrieveChunk", e);
  }
  async dispose() {
    await this.sendMessage("dispose"), this.worker.terminate();
  }
}
class E {
  constructor() {
    this.workerProxy = null, this.booted = !1;
  }
  async start() {
    this.booted || (this.workerProxy = new S(), await this.workerProxy.start(), this.booted = !0);
  }
  async loadScript(e) {
    if (!this.workerProxy) throw new Error("Engine not started. Call start() first.");
    await this.workerProxy.loadScript(e);
  }
  async process(e) {
    if (!this.workerProxy) throw new Error("Engine not started. Call start() first.");
    return this.workerProxy.process(e);
  }
  async dispose() {
    this.workerProxy && (await this.workerProxy.dispose(), this.workerProxy = null, this.booted = !1);
  }
}
class M {
  constructor() {
    this.provider = null;
  }
  setLocalState(e) {
    this.provider && this.provider.awareness.setLocalState(e);
  }
  getOnlineUsers() {
    return this.provider ? Array.from(this.provider.awareness.getStates().values()).filter(
      (e) => e && typeof e == "object" && e !== null && "id" in e && "name" in e
    ) : [];
  }
  onUpdate(e) {
    if (!this.provider) return () => {
    };
    const t = () => e(this.getOnlineUsers());
    return this.provider.awareness.on("change", t), t(), () => this.provider.awareness.off("change", t);
  }
  // Export for container processing
  exportToContainer() {
    return { users: this.getOnlineUsers(), timestamp: Date.now() };
  }
}
export {
  _ as MidiBridge,
  O as NetworkClient,
  M as PresenceManager,
  E as WebContainerEngine,
  h as isIndexedDBAvailable,
  u as storage
};
