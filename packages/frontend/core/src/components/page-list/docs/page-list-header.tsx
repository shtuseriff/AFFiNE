import { collectionsCRUDAtom } from '@affine/core/atoms/collections';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { ViewLayersIcon } from '@blocksuite/icons';
import { useCallback, useMemo } from 'react';

import { useCollectionManager } from '../use-collection-manager';
import * as styles from './page-list-header.css';
import { PageListNewPageButton } from './page-list-new-page-button';

export const PageListHeader = ({ workspaceId }: { workspaceId: string }) => {
  const t = useAFFiNEI18N();
  const setting = useCollectionManager(collectionsCRUDAtom);
  const { jumpToCollections } = useNavigateHelper();
  const handleJumpToCollections = useCallback(() => {
    jumpToCollections(workspaceId);
  }, [jumpToCollections, workspaceId]);

  const title = useMemo(() => {
    if (setting.isDefault) {
      return t['com.affine.all-pages.header']();
    }
    return (
      <>
        <div style={{ cursor: 'pointer' }} onClick={handleJumpToCollections}>
          {t['com.affine.collections.header']()} /
        </div>
        <div className={styles.titleIcon}>
          <ViewLayersIcon />
        </div>
        <div className={styles.titleCollectionName}>
          {setting.currentCollection.name}
        </div>
      </>
    );
  }, [
    handleJumpToCollections,
    setting.currentCollection.name,
    setting.isDefault,
    t,
  ]);

  return (
    <div className={styles.allPagesHeader}>
      <div className={styles.allPagesHeaderTitle}>{title}</div>
      <PageListNewPageButton testId="new-page-button-trigger">
        {t['New Page']()}
      </PageListNewPageButton>
    </div>
  );
};
