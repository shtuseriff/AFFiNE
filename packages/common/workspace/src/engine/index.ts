import { Slot } from '@blocksuite/global/utils';

import { throwIfAborted } from '../utils/throw-if-aborted';
import type { AwarenessProvider } from './awareness';
import type { BlobEngine } from './blob';
import type { SyncEngine, SyncEngineStatus } from './sync';

export interface WorkspaceEngineStatus {
  sync: SyncEngineStatus;
  blob: 'idle' | 'over-capacity';
}

/**
 * # WorkspaceEngine
 *
 * sync ydoc, blob, awareness together
 */
export class WorkspaceEngine {
  _status: WorkspaceEngineStatus;
  onStatusChange = new Slot<WorkspaceEngineStatus>();

  get status() {
    return this._status;
  }

  set status(status: WorkspaceEngineStatus) {
    this._status = status;
    this.onStatusChange.emit(status);
  }

  constructor(
    public blob: BlobEngine,
    public sync: SyncEngine,
    public awareness: AwarenessProvider[]
  ) {
    this._status = {
      sync: sync.status,
      blob: blob.isStorageOverCapacity() ? 'over-capacity' : 'idle',
    };
    sync.onStatusChange.on(status => {
      this.status = {
        sync: status,
        blob: blob.isStorageOverCapacity() ? 'over-capacity' : 'idle',
      };
    });
    blob.onCapacityChange.on(isOverCapacity => {
      this.status = {
        sync: sync.status,
        blob: isOverCapacity ? 'over-capacity' : 'idle',
      };
    });
  }

  start() {
    this.sync.start();
    for (const awareness of this.awareness) {
      awareness.connect();
    }
    this.blob.start();
  }

  canGracefulStop() {
    return this.sync.canGracefulStop();
  }

  async waitForGracefulStop(abort?: AbortSignal) {
    await this.sync.waitForGracefulStop(abort);
    throwIfAborted(abort);
    this.forceStop();
  }

  forceStop() {
    this.sync.forceStop();
    for (const awareness of this.awareness) {
      awareness.disconnect();
    }
    this.blob.stop();
  }
}

export * from './awareness';
export * from './blob';
export * from './sync';
