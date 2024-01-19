import { useTrashModalHelper } from '@affine/core/hooks/affine/use-trash-modal-helper';
import { useBlockSuitePageMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { Trans } from '@affine/i18n';
import { CloseIcon, DeleteIcon } from '@blocksuite/icons';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { FloatingToolbar } from '../components/floating-toolbar';
import * as styles from './page-list-floating-toolbar.css';

export const PageListFloatingToolbar = ({
  selectedIds,
  onClose,
  open,
}: {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
}) => {
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const { setTrashModal } = useTrashModalHelper(
    currentWorkspace.blockSuiteWorkspace
  );
  const pageMetas = useBlockSuitePageMeta(currentWorkspace.blockSuiteWorkspace);
  const handleMultiDelete = useCallback(() => {
    const pageNameMapping = Object.fromEntries(
      pageMetas.map(meta => [meta.id, meta.title])
    );

    const pageNames = selectedIds.map(id => pageNameMapping[id] ?? '');
    setTrashModal({
      open: true,
      pageIds: selectedIds,
      pageTitles: pageNames,
    });
  }, [pageMetas, selectedIds, setTrashModal]);

  return (
    <FloatingToolbar className={styles.floatingToolbar} open={open}>
      <FloatingToolbar.Item>
        <Trans
          i18nKey="com.affine.page.toolbar.selected"
          count={selectedIds.length}
        >
          <div className={styles.toolbarSelectedNumber}>
            {{ count: selectedIds.length } as any}
          </div>
          selected
        </Trans>
      </FloatingToolbar.Item>
      <FloatingToolbar.Button onClick={onClose} icon={<CloseIcon />} />
      <FloatingToolbar.Separator />
      <FloatingToolbar.Button
        onClick={handleMultiDelete}
        icon={<DeleteIcon />}
        type="danger"
        data-testid="page-list-toolbar-delete"
      />
    </FloatingToolbar>
  );
};
