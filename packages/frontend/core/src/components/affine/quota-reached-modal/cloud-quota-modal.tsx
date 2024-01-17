import { ConfirmModal } from '@affine/component/ui/modal';
import { openQuotaModalAtom, openSettingModalAtom } from '@affine/core/atoms';
import { useIsWorkspaceOwner } from '@affine/core/hooks/affine/use-is-workspace-owner';
import { useUserQuota } from '@affine/core/hooks/use-quota';
import { useWorkspaceQuota } from '@affine/core/hooks/use-workspace-quota';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';

export const CloudQuotaModal = () => {
  const t = useAFFiNEI18N();
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const [open, setOpen] = useAtom(openQuotaModalAtom);
  const workspaceQuota = useWorkspaceQuota(currentWorkspace.id);
  const isOwner = useIsWorkspaceOwner(currentWorkspace.meta);
  const userQuota = useUserQuota();
  const isFreePlanOwner = useMemo(() => {
    return isOwner && userQuota?.humanReadable.name.toLowerCase() === 'free';
  }, [isOwner, userQuota?.humanReadable.name]);

  const checkBlobSize = useCallback(
    (blob: Blob) => {
      const size = BigInt(blob.size);
      return size < workspaceQuota.blobLimit;
    },
    [workspaceQuota]
  );

  const setSettingModalAtom = useSetAtom(openSettingModalAtom);
  const handleUpgradeConfirm = useCallback(() => {
    if (isFreePlanOwner) {
      setSettingModalAtom({
        open: true,
        activeTab: 'plans',
      });
    }

    setOpen(false);
  }, [isFreePlanOwner, setOpen, setSettingModalAtom]);

  const description = useMemo(() => {
    if (userQuota && isFreePlanOwner) {
      return t['com.affine.payment.blob-limit.description.owner.free']({
        planName: userQuota.humanReadable.name,
        currentQuota: userQuota.humanReadable.blobLimit,
        upgradeQuota: '100MB',
      });
    }
    if (isOwner && userQuota?.humanReadable.name.toLowerCase() === 'pro') {
      return t['com.affine.payment.blob-limit.description.owner.pro']({
        planName: userQuota.humanReadable.name,
        quota: userQuota.humanReadable.blobLimit,
      });
    }
    return t['com.affine.payment.blob-limit.description.member']({
      quota: workspaceQuota.humanReadable.blobLimit,
    });
  }, [
    isFreePlanOwner,
    isOwner,
    t,
    userQuota,
    workspaceQuota.humanReadable.blobLimit,
  ]);

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
      title={t['com.affine.payment.blob-limit.title']()}
      onOpenChange={setOpen}
      description={description}
      cancelButtonOptions={{
        hidden: !isFreePlanOwner,
      }}
      onConfirm={handleUpgradeConfirm}
      confirmButtonOptions={{
        type: 'primary',
        children: isFreePlanOwner
          ? t['com.affine.payment.upgrade']()
          : t['Got it'](),
      }}
    />
  );
};
