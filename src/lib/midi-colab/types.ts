export interface MidiEvent {
  type: 'noteon' | 'noteoff' | 'cc';
  data: number[];
  timestamp: number;
  source: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  status: 'online' | 'idle';
}

export interface ProcessedMidiEvent extends MidiEvent {
  theory?: {
    scale?: string;
    harmony?: string;
  };
}

export interface ContainerInput {
  type: 'midi' | 'yjs-state' | 'presence' | 'logs';
  data: any;
}

export interface ContainerOutput {
  processed?: ProcessedMidiEvent[] | any;
  logs?: string[];
  errors?: string[];
}

export interface ScriptConfig {
  code: string;
  deps?: string[];
  path?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: 'message' | 'system' | 'midi-event';
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  timestamp: number;
  checksum?: string;
}

export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  checksum: string;
}

export interface FileUploadRequest {
  fileId: string;
  metadata: Omit<FileMetadata, 'id'>;
  totalChunks: number;
}

export interface FileDownloadRequest {
  fileId: string;
}

export interface FileTransferResult {
  success: boolean;
  fileId?: string;
  error?: string;
  data?: ArrayBuffer;
}

export interface MidiLogEntry {
  id: string;
  event: MidiEvent;
  userId: string;
  timestamp: number;
  processed?: boolean;
}

export type PresenceUpdateCallback = (users: User[]) => void;