import { pushNotificationAtom } from '@affine/component/notification-center';
import { Avatar } from '@affine/component/ui/avatar';
import { Loading } from '@affine/component/ui/loading';
import { Tooltip } from '@affine/component/ui/tooltip';
import { useUserQuota } from '@affine/core/hooks/use-quota';
import { useWorkspaceBlobObjectUrl } from '@affine/core/hooks/use-workspace-blob';
import { useWorkspaceInfo } from '@affine/core/hooks/use-workspace-info';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { type SyncEngineStatus, SyncEngineStep } from '@affine/workspace';
import {
  CloudWorkspaceIcon,
  InformationFillDuotoneIcon,
  LocalWorkspaceIcon,
  NoNetworkIcon,
  UnsyncIcon,
} from '@blocksuite/icons';
import bytes from 'bytes';
import { useAtomValue, useSetAtom } from 'jotai';
import { debounce, mean } from 'lodash-es';
import {
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSystemOnline } from '../../../../hooks/use-system-online';
import {
  StyledSelectorContainer,
  StyledSelectorWrapper,
  StyledWorkspaceName,
  StyledWorkspaceStatus,
} from './styles';

// FIXME:
// 1. Remove mui style
// 2. Refactor the code to improve readability
const CloudWorkspaceStatus = () => {
  return (
    <>
      <CloudWorkspaceIcon />
      AFFiNE Cloud
    </>
  );
};

const SyncingWorkspaceStatus = ({ progress }: { progress?: number }) => {
  return (
    <>
      <Loading progress={progress} speed={progress ? 0 : undefined} />
      Syncing...
    </>
  );
};

const UnSyncWorkspaceStatus = () => {
  return (
    <>
      <UnsyncIcon />
      Wait for upload
    </>
  );
};

const LocalWorkspaceStatus = () => {
  return (
    <>
      {!environment.isDesktop ? (
        <InformationFillDuotoneIcon data-warning-color="true" />
      ) : (
        <LocalWorkspaceIcon />
      )}
      Local
    </>
  );
};

const OfflineStatus = () => {
  return (
    <>
      <NoNetworkIcon />
      Offline
    </>
  );
};

const useSyncEngineSyncProgress = () => {
  const isOnline = useSystemOnline();

  const [syncEngineStatus, setSyncEngineStatus] =
    useState<SyncEngineStatus | null>(null);

  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);

  //FIXME: need to use owner quota
  const quota = useUserQuota();
  const pushNotification = useSetAtom(pushNotificationAtom);
  const checkBlobSize = useCallback(
    (blob: Blob) => {
      const size = blob.size;

      if (
        currentWorkspace.flavour === WorkspaceFlavour.LOCAL ||
        quota === null
      ) {
        const result = size < bytes('100MB');
        if (!result) {
          pushNotification({
            title: 'You have reached the limit',
            message:
              'The maximum file upload size for local workspaces is 100MB',
            key: Date.now().toString(),
            type: 'error',
          });
          return false;
        }
      } else if (
        currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD &&
        quota
      ) {
        const result = size < quota.blobLimit;
        if (!result) {
          pushNotification({
            title: 'Upload failed',
            message: 'Please upgrade your plan to upload more files',
            key: Date.now().toString(),
            type: 'error',
          });
          return false;
        }
      }
      return true;
    },
    [currentWorkspace.flavour, pushNotification, quota]
  );

  // debounce sync engine status
  useEffect(() => {
    setSyncEngineStatus(currentWorkspace.engine.sync.status);
    const disposable = currentWorkspace.engine.sync.onStatusChange.on(
      debounce(
        status => {
          setSyncEngineStatus(status);
        },
        300,
        {
          maxWait: 500,
          trailing: true,
        }
      )
    );
    const disposableBlobSet = currentWorkspace.engine.blob.onBlobSet.on(
      blobSetEventArgs => {
        console.log('blob set', blobSetEventArgs);
        const result = checkBlobSize(blobSetEventArgs.value);
        blobSetEventArgs.updateShouldProceed(result);
      }
    );
    return () => {
      disposable?.dispose();
      disposableBlobSet?.dispose();
    };
  }, [checkBlobSize, currentWorkspace]);

  const progress = useMemo(() => {
    if (!syncEngineStatus?.remotes || syncEngineStatus?.remotes.length === 0) {
      return null;
    }
    return mean(
      syncEngineStatus.remotes.map(peer => {
        if (!peer) {
          return 0;
        }
        const totalTask =
          peer.totalDocs + peer.pendingPullUpdates + peer.pendingPushUpdates;
        const doneTask = peer.loadedDocs;

        return doneTask / totalTask;
      })
    );
  }, [syncEngineStatus?.remotes]);

  const content = useMemo(() => {
    // TODO: add i18n
    if (currentWorkspace.flavour === WorkspaceFlavour.LOCAL) {
      if (!environment.isDesktop) {
        return 'This is a local demo workspace.';
      }
      return 'Saved locally';
    }
    if (!isOnline) {
      return 'Disconnected, please check your network connection';
    }
    if (!syncEngineStatus || syncEngineStatus.step === SyncEngineStep.Syncing) {
      return (
        `Syncing with AFFiNE Cloud` +
        (progress ? ` (${Math.floor(progress * 100)}%)` : '')
      );
    }
    if (syncEngineStatus.retrying) {
      return 'Sync disconnected due to unexpected issues, reconnecting.';
    }
    return 'Synced with AFFiNE Cloud';
  }, [currentWorkspace.flavour, isOnline, progress, syncEngineStatus]);

  const CloudWorkspaceSyncStatus = useCallback(() => {
    if (!syncEngineStatus || syncEngineStatus.step === SyncEngineStep.Syncing) {
      return SyncingWorkspaceStatus({
        progress: progress ? Math.max(progress, 0.2) : undefined,
      });
    } else if (syncEngineStatus.retrying) {
      return UnSyncWorkspaceStatus();
    } else {
      return CloudWorkspaceStatus();
    }
  }, [progress, syncEngineStatus]);

  return {
    message: content,
    icon:
      currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD ? (
        !isOnline ? (
          <OfflineStatus />
        ) : (
          <CloudWorkspaceSyncStatus />
        )
      ) : (
        <LocalWorkspaceStatus />
      ),
  };
};

const WorkspaceStatus = () => {
  const { message, icon } = useSyncEngineSyncProgress();

  return (
    <div style={{ display: 'flex' }}>
      <Tooltip content={message}>
        <StyledWorkspaceStatus>{icon}</StyledWorkspaceStatus>
      </Tooltip>
    </div>
  );
};

export const WorkspaceCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);

  const information = useWorkspaceInfo(currentWorkspace.meta);

  const avatarUrl = useWorkspaceBlobObjectUrl(
    currentWorkspace.meta,
    information?.avatar
  );

  const name = information?.name ?? UNTITLED_WORKSPACE_NAME;

  return (
    <StyledSelectorContainer
      role="button"
      tabIndex={0}
      data-testid="current-workspace"
      id="current-workspace"
      ref={ref}
      {...props}
    >
      <Avatar
        data-testid="workspace-avatar"
        size={40}
        url={avatarUrl}
        name={name}
        colorfulFallback
      />
      <StyledSelectorWrapper>
        <StyledWorkspaceName data-testid="workspace-name">
          {name}
        </StyledWorkspaceName>
        <WorkspaceStatus />
      </StyledSelectorWrapper>
    </StyledSelectorContainer>
  );
});

WorkspaceCard.displayName = 'WorkspaceCard';
