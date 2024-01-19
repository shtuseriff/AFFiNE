import type { DeleteCollectionInfo } from '@affine/env/filter';
import { Trans } from '@affine/i18n';
import { CloseIcon, DeleteIcon } from '@blocksuite/icons';
import { useCallback } from 'react';

import { FloatingToolbar } from '../components/floating-toolbar';
import type { useCollectionManager } from '../use-collection-manager';
import * as styles from './collection-list-floating-toolbar.css';

export const CollectionListFloatingToolbar = ({
  selectedIds,
  onClose,
  open,
  setting,
  info,
}: {
  open: boolean;
  selectedIds: string[];
  info: DeleteCollectionInfo;
  setting: ReturnType<typeof useCollectionManager>;
  onClose: () => void;
}) => {
  const handleDelete = useCallback(() => {
    return setting.deleteCollection(info, ...selectedIds);
  }, [setting, info, selectedIds]);

  return (
    <FloatingToolbar className={styles.floatingToolbar} open={open}>
      <FloatingToolbar.Item>
        <Trans
          i18nKey="com.affine.collection.toolbar.selected"
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
        onClick={handleDelete}
        icon={<DeleteIcon />}
        type="danger"
        data-testid="collection-list-toolbar-delete"
      />
    </FloatingToolbar>
  );
};
