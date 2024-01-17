import { DebugLogger } from '@affine/debug';
import { Slot } from '@blocksuite/global/utils';
import { difference } from 'lodash-es';

export interface BlobSetEventArgs {
  key: string;
  value: Blob;
  updateShouldProceed: (proceed: boolean) => void;
}

const logger = new DebugLogger('affine:blob-engine');

/**
 * # BlobEngine
 *
 * sync blobs between storages in background.
 *
 * all operations priority use local, then use remote.
 */
export class BlobEngine {
  private abort: AbortController | null = null;
  private _isOverCapacity: boolean = false;
  onCapacityChange = new Slot<boolean>();
  onBlobSet = new Slot<BlobSetEventArgs>();

  private set isOverCapacity(value: boolean) {
    if (this._isOverCapacity !== value) {
      this._isOverCapacity = value;
      this.onCapacityChange.emit(value);
    }
  }

  constructor(
    private readonly local: BlobStorage,
    private readonly remotes: BlobStorage[]
  ) {}

  start() {
    if (this.abort) {
      return;
    }
    this.abort = new AbortController();
    const abortSignal = this.abort.signal;

    const sync = () => {
      if (abortSignal.aborted) {
        return;
      }

      this.sync()
        .catch(error => {
          logger.error('sync blob error', error);
        })
        .finally(() => {
          // sync every 1 minute
          setTimeout(sync, 60000);
        });
    };

    sync();
  }

  stop() {
    this.abort?.abort();
    this.abort = null;
  }

  get storages() {
    return [this.local, ...this.remotes];
  }

  async sync() {
    if (this.local.readonly) {
      return;
    }
    logger.debug('start syncing blob...');
    for (const remote of this.remotes) {
      let localList: string[] = [];
      let remoteList: string[] = [];

      if (!remote.readonly) {
        try {
          localList = await this.local.list();
          remoteList = await remote.list();
        } catch (err) {
          logger.error(`error when sync`, err);
          continue;
        }

        const needUpload = difference(localList, remoteList);
        for (const key of needUpload) {
          try {
            const data = await this.local.get(key);
            if (data) {
              await remote.set(key, data);
            }
          } catch (err) {
            const code = (err as any)[0].extensions.code;
            if (code === 413) {
              this.isOverCapacity = true;
              logger.error('Storage or blob over capacity', err);
            } else {
              logger.error(
                `error when sync ${key} from [${this.local.name}] to [${remote.name}]`,
                err
              );
            }
          }
        }
      }

      const needDownload = difference(remoteList, localList);

      for (const key of needDownload) {
        try {
          const data = await remote.get(key);
          if (data) {
            await this.local.set(key, data);
          }
        } catch (err) {
          logger.error(
            `error when sync ${key} from [${remote.name}] to [${this.local.name}]`,
            err
          );
        }
      }
    }

    logger.debug('finish syncing blob');
  }

  async get(key: string) {
    logger.debug('get blob', key);
    for (const storage of this.storages) {
      const data = await storage.get(key);
      if (data) {
        return data;
      }
    }
    return null;
  }

  async set(key: string, value: Blob) {
    if (this.local.readonly) {
      throw new Error('local peer is readonly');
    }

    let shouldProceed = true;

    const updateShouldProceed = (proceed: boolean) => {
      shouldProceed = proceed;
    };

    this.onBlobSet.emit({ key, value, updateShouldProceed });

    if (!shouldProceed) {
      logger.error('blob over limit, abort set');
      return key;
    }

    // await upload to the local peer
    await this.local.set(key, value);

    // uploads to other peers in the background
    Promise.allSettled(
      this.remotes
        .filter(r => !r.readonly)
        .map(peer =>
          peer.set(key, value).catch(err => {
            const code = err[0].extensions.code;
            if (code === 413) {
              this.isOverCapacity = true;
              logger.error('Storage or blob over capacity', err);
            } else {
              logger.error('Error when uploading to peer', err);
            }
          })
        )
    )
      .then(result => {
        if (result.some(({ status }) => status === 'rejected')) {
          logger.error(
            `blob ${key} update finish, but some peers failed to update`
          );
        } else {
          this.isOverCapacity = false;
          logger.debug(`blob ${key} update finish`);
        }
      })
      .catch(() => {
        // Promise.allSettled never reject
      });

    return key;
  }

  async delete(_key: string) {
    // not supported
  }

  async list() {
    const blobList = new Set<string>();

    for (const peer of this.storages) {
      const list = await peer.list();
      if (list) {
        for (const blob of list) {
          blobList.add(blob);
        }
      }
    }

    return Array.from(blobList);
  }

  isStorageOverCapacity() {
    return this.isOverCapacity;
  }
}

export interface BlobStorage {
  name: string;
  readonly: boolean;
  get: (key: string) => Promise<Blob | null>;
  set: (key: string, value: Blob) => Promise<string>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<string[]>;
}

export function createMemoryBlobStorage() {
  const map = new Map<string, Blob>();
  return {
    name: 'memory',
    readonly: false,
    async get(key: string) {
      return map.get(key) ?? null;
    },
    async set(key: string, value: Blob) {
      map.set(key, value);
      return key;
    },
    async delete(key: string) {
      map.delete(key);
    },
    async list() {
      return Array.from(map.keys());
    },
  } satisfies BlobStorage;
}
