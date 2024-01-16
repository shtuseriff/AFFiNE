import { ConfirmModal } from '@affine/component/ui/modal';
import { openQuotaModalAtom } from '@affine/core/atoms';
import { useIsWorkspaceOwner } from '@affine/core/hooks/affine/use-is-workspace-owner';
import { useUserQuota } from '@affine/core/hooks/use-quota';
import { useWorkspaceQuota } from '@affine/core/hooks/use-workspace-quota';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import bytes from 'bytes';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';

export const CloudQuotaModal = () => {
  const t = useAFFiNEI18N();
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const [open, setOpen] = useAtom(openQuotaModalAtom);
  const workspaceQuota = useWorkspaceQuota(currentWorkspace.id);
  const isOwner = useIsWorkspaceOwner(currentWorkspace.meta);
  const userQuota = useUserQuota();
  const isFreePlanOwner = useMemo(() => {
    return isOwner && userQuota?.name.toLowerCase() === 'free';
  }, [isOwner, userQuota?.name]);

  const checkBlobSize = useCallback(
    (blob: Blob) => {
      const size = BigInt(blob.size);
      return size < BigInt(workspaceQuota.blobLimit);
    },
    [workspaceQuota.blobLimit]
  );

  const onConfirm = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const description = useMemo(() => {
    if (userQuota && isFreePlanOwner) {
      return `${userQuota.name} users can upload files with a maximum size of ${userQuota.humanReadable.blobLimit}. You can upgrade your account to unlock a maximum file size of 100MB.`;
    }
    if (isOwner && userQuota?.name.toLowerCase() === 'pro') {
      return `${userQuota.name} users can upload files with a maximum size of ${userQuota.humanReadable.blobLimit}.`;
    }

    return `The maximum file upload size for this joined workspace is ${bytes(
      workspaceQuota.blobLimit
    )}. You can contact the owner of this workspace.`;
  }, [isFreePlanOwner, isOwner, userQuota, workspaceQuota.blobLimit]);

  useEffect(() => {
    const disposable = currentWorkspace.engine.blob.onBlobSet.on(
      blobSetEventArgs => {
        if (!checkBlobSize(blobSetEventArgs.value)) {
          setOpen(true);
          blobSetEventArgs.updateShouldProceed(false);
        }
      }
    );
    return () => {
      disposable?.dispose();
    };
  }, [checkBlobSize, currentWorkspace.engine.blob.onBlobSet, setOpen]);

  return (
    <ConfirmModal
      open={open}
      title={'You have reached the limit'}
      description={description}
      cancelText={t['com.affine.enableAffineCloudModal.button.cancel']()}
      cancelButtonOptions={{
        hidden: !isFreePlanOwner,
      }}
      onConfirm={onConfirm}
      confirmButtonOptions={{
        type: 'primary',
        children: isFreePlanOwner
          ? t['com.affine.payment.upgrade']()
          : t['Got it'](),
      }}
    />
  );
};
