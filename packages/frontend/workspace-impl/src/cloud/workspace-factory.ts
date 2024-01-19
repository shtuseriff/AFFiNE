import { setupEditorFlags } from '@affine/env/global';
import type { WorkspaceFactory } from '@affine/workspace';
import { BlobEngine, SyncEngine, WorkspaceEngine } from '@affine/workspace';
import { globalBlockSuiteSchema } from '@affine/workspace';
import { Workspace } from '@affine/workspace';
import { Workspace as BlockSuiteWorkspace } from '@blocksuite/store';
import { nanoid } from 'nanoid';

import { createBroadcastChannelAwarenessProvider } from '../local/awareness';
import { createLocalBlobStorage } from '../local/blob';
import { createStaticBlobStorage } from '../local/blob-static';
import { createLocalStorage } from '../local/sync';
import { createCloudAwarenessProvider } from './awareness';
import { createAffineCloudBlobStorage } from './blob';
import { createAffineStorage } from './sync';

export const cloudWorkspaceFactory: WorkspaceFactory = {
  name: 'affine-cloud',
  openWorkspace(metadata) {
    const blobEngine = new BlobEngine(createLocalBlobStorage(metadata.id), [
      createAffineCloudBlobStorage(metadata.id),
      createStaticBlobStorage(),
    ]);

    // create blocksuite workspace
    const bs = new BlockSuiteWorkspace({
      id: metadata.id,
      blobStorages: [
        () => ({
          crud: blobEngine,
        }),
      ],
      idGenerator: () => nanoid(),
      schema: globalBlockSuiteSchema,
    });

    const affineStorage = createAffineStorage(metadata.id);
    const remoteStorage = [affineStorage];

    const syncEngine = new SyncEngine(
      bs.doc,
      createLocalStorage(metadata.id),
      remoteStorage
    );

    const awarenessProviders = [
      createBroadcastChannelAwarenessProvider(
        metadata.id,
        bs.awarenessStore.awareness
      ),
      createCloudAwarenessProvider(metadata.id, bs.awarenessStore.awareness),
    ];

    const engine = new WorkspaceEngine(
      blobEngine,
      syncEngine,
      awarenessProviders
    );

    affineStorage.onReject(reason => {
      console.error('affine storage reject, fallback to local:', reason);
      //remove remote storage and awareness provider
      remoteStorage.pop()?.disconnect();
      awarenessProviders.pop()?.disconnect();
      // restart sync engine with local source
      engine.forceStop();
      engine.start();
    });

    setupEditorFlags(bs);

    const workspace = new Workspace(metadata, engine, bs);

    workspace.onStop.once(() => {
      // affine sync storage need manually disconnect
      affineStorage.disconnect();
    });

    return workspace;
  },
  async getWorkspaceBlob(id: string, blobKey: string): Promise<Blob | null> {
    // try to get blob from local storage first
    const localBlobStorage = createLocalBlobStorage(id);
    const localBlob = await localBlobStorage.get(blobKey);
    if (localBlob) {
      return localBlob;
    }

    const blobStorage = createAffineCloudBlobStorage(id);
    return await blobStorage.get(blobKey);
  },
};
