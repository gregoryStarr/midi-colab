/**
 * Represents a MIDI event.
 */
export interface MidiEvent {
  /** The type of MIDI message (note on, note off, or control change). */
  type: 'noteon' | 'noteoff' | 'cc';
  /** The raw data bytes of the MIDI message. */
  data: number[];
  /** The timestamp when the event occurred. */
  timestamp: number;
  /** The source device or entity that generated the event. */
  source: string;
}

/**
 * Represents a user in the collaboration session.
 */
export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  status: 'online' | 'idle';
}

/**
 * Represents a MIDI event that has been processed with music theory information.
 */
export interface ProcessedMidiEvent extends MidiEvent {
  theory?: {
    scale?: string;
    harmony?: string;
  };
}

/**
 * Represents input data sent to the WebContainerEngine.
 */
export interface ContainerInput {
  type: 'midi' | 'yjs-state' | 'presence' | 'logs';
  data: any;
}

/**
 * Represents output data received from the WebContainerEngine.
 */
export interface ContainerOutput {
  processed?: ProcessedMidiEvent[] | any;
  logs?: string[];
  errors?: string[];
}

/**
 * Configuration for loading a script into the WebContainer.
 */
export interface ScriptConfig {
  /** The source code of the script. */
  code: string;
  /** List of npm dependencies required by the script. */
  deps?: string[];
  /** Optional file path for the script. */
  path?: string;
}

/**
 * Represents a chat message in the collaboration session.
 */
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: 'message' | 'system' | 'midi-event';
}

/**
 * Metadata for a shared file.
 */
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

/**
 * Represents a chunk of a large file being transferred.
 */
export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  checksum: string;
}

/**
 * Request payload for initiating a file upload.
 */
export interface FileUploadRequest {
  fileId: string;
  metadata: Omit<FileMetadata, 'id'>;
  totalChunks: number;
}

/**
 * Request payload for downloading a file.
 */
export interface FileDownloadRequest {
  fileId: string;
}

/**
 * Result of a file transfer operation.
 */
export interface FileTransferResult {
  success: boolean;
  fileId?: string;
  error?: string;
  data?: ArrayBuffer;
}

/**
 * Log entry for a MIDI event.
 */
export interface MidiLogEntry {
  id: string;
  event: MidiEvent;
  userId: string;
  timestamp: number;
  processed?: boolean;
}

/**
 * Callback function for presence updates.
 */
export type PresenceUpdateCallback = (users: User[]) => void;