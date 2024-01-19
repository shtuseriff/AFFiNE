import { toast } from '@affine/component';
import { useBlockSuiteMetaHelper } from '@affine/core/hooks/affine/use-block-suite-meta-helper';
import { useTrashModalHelper } from '@affine/core/hooks/affine/use-trash-modal-helper';
import { useBlockSuitePageMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { PageMeta } from '@blocksuite/store';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useRef, useState } from 'react';

import { usePageHelper } from '../../blocksuite/block-suite-page-list/utils';
import { PageOperationCell } from '../operation-cell';
import { PageListItemRenderer } from '../page-group';
import { ListTableHeader } from '../page-header';
import type { ItemListHandle, ListItem } from '../types';
import { useFilteredPageMetas } from '../use-filtered-page-metas';
import { useHeaderColDef } from '../use-header-col-def';
import { VirtualizedList } from '../virtualized-list';
import { PageListFloatingToolbar } from './page-list-floating-toolbar';
import { PageListHeader } from './page-list-header';

const usePageOperationsRenderer = () => {
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const { setTrashModal } = useTrashModalHelper(
    currentWorkspace.blockSuiteWorkspace
  );
  const { toggleFavorite } = useBlockSuiteMetaHelper(
    currentWorkspace.blockSuiteWorkspace
  );
  const t = useAFFiNEI18N();
  const pageOperationsRenderer = useCallback(
    (page: PageMeta) => {
      const onDisablePublicSharing = () => {
        toast('Successfully disabled', {
          portal: document.body,
        });
      };
      return (
        <PageOperationCell
          favorite={!!page.favorite}
          isPublic={!!page.isPublic}
          onDisablePublicSharing={onDisablePublicSharing}
          link={`/workspace/${currentWorkspace.id}/${page.id}`}
          onRemoveToTrash={() =>
            setTrashModal({
              open: true,
              pageIds: [page.id],
              pageTitles: [page.title],
            })
          }
          onToggleFavoritePage={() => {
            const status = page.favorite;
            toggleFavorite(page.id);
            toast(
              status
                ? t['com.affine.toastMessage.removedFavorites']()
                : t['com.affine.toastMessage.addedFavorites']()
            );
          }}
        />
      );
    },
    [currentWorkspace.id, setTrashModal, t, toggleFavorite]
  );

  return pageOperationsRenderer;
};

export const VirtualizedPageList = ({
  setHideHeaderCreateNewPage,
}: {
  setHideHeaderCreateNewPage: (hide: boolean) => void;
}) => {
  const listRef = useRef<ItemListHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const pageMetas = useBlockSuitePageMeta(currentWorkspace.blockSuiteWorkspace);
  const pageOperations = usePageOperationsRenderer();
  const { pageHeaderColsDef } = useHeaderColDef();
  const pageHeaderCols = useMemo(
    () => pageHeaderColsDef(true),
    [pageHeaderColsDef]
  );
  const { isPreferredEdgeless } = usePageHelper(
    currentWorkspace.blockSuiteWorkspace
  );

  const filteredPageMetas = useFilteredPageMetas(
    'all',
    pageMetas,
    currentWorkspace.blockSuiteWorkspace
  );

  const filteredSelectedPageIds = useMemo(() => {
    const ids = filteredPageMetas.map(page => page.id);
    return selectedPageIds.filter(id => ids.includes(id));
  }, [filteredPageMetas, selectedPageIds]);

  const hideFloatingToolbar = useCallback(() => {
    listRef.current?.toggleSelectable();
  }, []);

  const pageOperationRenderer = useCallback(
    (item: ListItem) => {
      const page = item as PageMeta;
      return pageOperations(page);
    },
    [pageOperations]
  );

  const pageHeaderRenderer = useCallback(() => {
    return <ListTableHeader headerCols={pageHeaderCols} />;
  }, [pageHeaderCols]);

  const pageItemRenderer = useCallback((item: ListItem) => {
    return <PageListItemRenderer {...item} />;
  }, []);

  return (
    <>
      <VirtualizedList
        ref={listRef}
        selectable="toggle"
        draggable
        atTopThreshold={80}
        atTopStateChange={setHideHeaderCreateNewPage}
        onSelectionActiveChange={setShowFloatingToolbar}
        heading={<PageListHeader workspaceId={currentWorkspace.id} />}
        selectedIds={filteredSelectedPageIds}
        onSelectedIdsChange={setSelectedPageIds}
        items={filteredPageMetas}
        rowAsLink
        isPreferredEdgeless={isPreferredEdgeless}
        blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
        operationsRenderer={pageOperationRenderer}
        itemRenderer={pageItemRenderer}
        headerRenderer={pageHeaderRenderer}
      />
      <PageListFloatingToolbar
        open={showFloatingToolbar && filteredSelectedPageIds.length > 0}
        selectedIds={filteredSelectedPageIds}
        onClose={hideFloatingToolbar}
      />
    </>
  );
};
