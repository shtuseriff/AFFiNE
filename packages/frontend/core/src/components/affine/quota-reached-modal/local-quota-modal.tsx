import { ConfirmModal } from '@affine/component/ui/modal';
import { openQuotaModalAtom } from '@affine/core/atoms';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import bytes from 'bytes';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect } from 'react';

export const LocalQuotaModal = () => {
  const t = useAFFiNEI18N();
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const [open, setOpen] = useAtom(openQuotaModalAtom);

  const checkBlobSize = useCallback((blob: Blob) => {
    const size = BigInt(blob.size);
    return size < bytes('100MB');
  }, []);

  const onConfirm = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

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
      description={t['com.affine.payment.blob-limit.description.local']({
        quota: '100MB',
      })}
      onOpenChange={setOpen}
      cancelButtonOptions={{
        hidden: true,
      }}
      onConfirm={onConfirm}
      confirmButtonOptions={{
        type: 'primary',
        children: t['Got it'](),
      }}
    />
  );
};
