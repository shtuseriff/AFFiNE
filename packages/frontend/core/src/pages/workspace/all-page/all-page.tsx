import { toast } from '@affine/component';
import type { AllPageFilterOption } from '@affine/core/atoms';
import { collectionsCRUDAtom } from '@affine/core/atoms/collections';
import { HubIsland } from '@affine/core/components/affine/hub-island';
import { usePageHelper } from '@affine/core/components/blocksuite/block-suite-page-list/utils';
import {
  CollectionList,
  type CollectionMeta,
  currentCollectionAtom,
  FloatingToolbar,
  type ItemListHandle,
  type ListItem,
  NewPageButton as PureNewPageButton,
  OperationCell,
  useCollectionManager,
  VirtualizedList,
} from '@affine/core/components/page-list';
import {
  CollectionListItemRenderer,
  PageListItemRenderer,
} from '@affine/core/components/page-list/page-group';
import { Header } from '@affine/core/components/pure/header';
import { WindowsAppControls } from '@affine/core/components/pure/header/windows-app-controls';
import { WorkspaceModeFilterTab } from '@affine/core/components/pure/workspace-mode-filter-tab';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import { useBlockSuiteMetaHelper } from '@affine/core/hooks/affine/use-block-suite-meta-helper';
import { useDeleteCollectionInfo } from '@affine/core/hooks/affine/use-delete-collection-info';
import { useFilteredPageMetas } from '@affine/core/hooks/affine/use-filtered-page-metas';
import { useTrashModalHelper } from '@affine/core/hooks/affine/use-trash-modal-helper';
import { useBlockSuitePageMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { performanceRenderLogger } from '@affine/core/shared';
import { Trans } from '@affine/i18n';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  CloseIcon,
  DeleteIcon,
  PlusIcon,
  ViewLayersIcon,
} from '@blocksuite/icons';
import type { PageMeta, Workspace } from '@blocksuite/store';
import clsx from 'clsx';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { NIL } from 'uuid';

import { EmptyPageList } from '../page-list-empty';
import * as styles from './all-page.css';
import { FilterContainer } from './all-page-filter';
import { CollectionListHeader } from './collection/collection-list';

//TODO: remove mock data
const mockFilteredCollectionMetas: CollectionMeta[] = [
  {
    id: '1',
    title: 'Collection 1',
    createDate: new Date(),
    pageIds: ['11', '12', '13'],
    collectionId: '1',
  },
  {
    id: '2',
    title: 'Collection 2',
    createDate: new Date(),
    pageIds: ['21', '22', '23'],
    collectionId: '2',
  },
  {
    id: '3',
    title: 'Collection 3',
    createDate: new Date(),
    pageIds: ['31', '32', '33'],
    collectionId: '3',
  },
  {
    id: '4',
    title: 'Collection 4',
    createDate: new Date(),
    pageIds: ['41', '42', '43'],
    collectionId: '4',
  },
  {
    id: '5',
    title: 'Collection 5',
    createDate: new Date(),
    pageIds: ['51', '52', '53'],
    collectionId: '5',
  },
  {
    id: '6',
    title: 'Collection 6',
    createDate: new Date(),
    pageIds: ['61', '62', '63'],
    collectionId: '6',
  },
  {
    id: '7',
    title: 'Collection 7',
    createDate: new Date(),
    pageIds: ['71', '72', '73'],
    collectionId: '7',
  },
  {
    id: '8',
    title: 'Collection 8',
    createDate: new Date(),
    pageIds: ['81', '82', '83'],
    collectionId: '8',
  },
  {
    id: '9',
    title: 'Collection 9',
    createDate: new Date(),
    pageIds: ['91', '92', '93'],
    collectionId: '9',
  },
  {
    id: '10',
    title: 'Collection 10',
    createDate: new Date(),
    pageIds: ['101', '102', '103'],
    collectionId: '10',
  },
];

const PageListHeader = () => {
  const t = useAFFiNEI18N();
  const setting = useCollectionManager(collectionsCRUDAtom);
  const title = useMemo(() => {
    if (setting.isDefault) {
      return t['com.affine.all-pages.header']();
    }
    return (
      <>
        {t['com.affine.collections.header']()} /
        <div className={styles.titleIcon}>
          <ViewLayersIcon />
        </div>
        <div className={styles.titleCollectionName}>
          {setting.currentCollection.name}
        </div>
      </>
    );
  }, [setting.currentCollection.name, setting.isDefault, t]);

  return (
    <div className={styles.allPagesHeader}>
      <div className={styles.allPagesHeaderTitle}>{title}</div>
      <NewPageButton testId="new-page-button-trigger">
        {t['New Page']()}
      </NewPageButton>
    </div>
  );
};

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
        <OperationCell
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

const PageListFloatingToolbar = ({
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

const NewPageButton = ({
  className,
  children,
  size,
  testId,
}: PropsWithChildren<{
  className?: string;
  size?: 'small' | 'default';
  testId?: string;
}>) => {
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const { importFile, createEdgeless, createPage } = usePageHelper(
    currentWorkspace.blockSuiteWorkspace
  );
  return (
    <div className={className} data-testid={testId}>
      <PureNewPageButton
        size={size}
        importFile={importFile}
        createNewEdgeless={createEdgeless}
        createNewPage={createPage}
      >
        <div className={styles.newPageButtonLabel}>{children}</div>
      </PureNewPageButton>
    </div>
  );
};

const AllPageHeader = ({
  workspace,
  showCreateNew,
  activeFilter,
}: {
  workspace: Workspace;
  showCreateNew: boolean;
  activeFilter: AllPageFilterOption;
}) => {
  const setting = useCollectionManager(collectionsCRUDAtom);
  const config = useAllPageListConfig();
  const userInfo = useDeleteCollectionInfo();
  const isWindowsDesktop = environment.isDesktop && environment.isWindows;

  return (
    <>
      <Header
        left={
          <CollectionList
            userInfo={userInfo}
            allPageListConfig={config}
            setting={setting}
            propertiesMeta={workspace.meta.properties}
          />
        }
        right={
          <div className={styles.headerRightWindows}>
            <NewPageButton
              size="small"
              className={clsx(
                styles.headerCreateNewButton,
                !showCreateNew && styles.headerCreateNewButtonHidden
              )}
            >
              <PlusIcon />
            </NewPageButton>
            {isWindowsDesktop ? <WindowsAppControls /> : null}
          </div>
        }
        center={
          <WorkspaceModeFilterTab
            workspaceId={workspace.id}
            activeFilter={activeFilter}
          />
        }
      />
      <FilterContainer />
    </>
  );
};

// even though it is called all page, it is also being used for collection route as well
export const AllPage = ({
  activeFilter,
}: {
  activeFilter: AllPageFilterOption;
}) => {
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const { isPreferredEdgeless } = usePageHelper(
    currentWorkspace.blockSuiteWorkspace
  );
  const pageMetas = useBlockSuitePageMeta(currentWorkspace.blockSuiteWorkspace);
  const pageOperations = usePageOperationsRenderer();

  const pageOperationRenderer = useCallback(
    (item: ListItem) => {
      const page = item as PageMeta;
      return pageOperations(page);
    },
    [pageOperations]
  );

  const filteredPageMetas = useFilteredPageMetas(
    'all',
    pageMetas,
    currentWorkspace.blockSuiteWorkspace
  );
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const listRef = useRef<ItemListHandle>(null);

  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);

  const hideFloatingToolbar = useCallback(() => {
    listRef.current?.toggleSelectable();
  }, []);

  // make sure selected id is in the filtered list
  const filteredSelectedPageIds = useMemo(() => {
    const ids = filteredPageMetas.map(page => page.id);
    return selectedPageIds.filter(id => ids.includes(id));
  }, [filteredPageMetas, selectedPageIds]);

  const [hideHeaderCreateNewPage, setHideHeaderCreateNewPage] = useState(true);

  const setting = useCollectionManager(collectionsCRUDAtom);

  const selectedCollectionIds = useMemo(() => {
    const ids = mockFilteredCollectionMetas.map(collection => collection.id);
    return selectedPageIds.filter(id => ids.includes(id));
  }, [selectedPageIds]);

  const pageItemRenderer = useCallback((item: ListItem) => {
    return <PageListItemRenderer {...item} />;
  }, []);

  const collectionItemRenderer = useCallback((item: ListItem) => {
    return <CollectionListItemRenderer {...item} />;
  }, []);

  return (
    <div className={styles.root}>
      <AllPageHeader
        workspace={currentWorkspace.blockSuiteWorkspace}
        showCreateNew={!hideHeaderCreateNewPage}
        activeFilter={activeFilter}
      />
      {filteredPageMetas.length > 0 ? (
        activeFilter === 'collections' && setting.isDefault ? (
          <>
            <VirtualizedList
              ref={listRef}
              selectable="toggle"
              draggable={false}
              atTopThreshold={80}
              atTopStateChange={setHideHeaderCreateNewPage}
              onSelectionActiveChange={setShowFloatingToolbar}
              heading={<CollectionListHeader />}
              selectedIds={selectedCollectionIds}
              onSelectedIdsChange={setSelectedPageIds}
              items={mockFilteredCollectionMetas}
              itemRenderer={collectionItemRenderer}
              rowAsLink
              blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
              operationsRenderer={pageOperationRenderer}
            />
            <PageListFloatingToolbar
              open={showFloatingToolbar && selectedCollectionIds.length > 0}
              selectedIds={selectedCollectionIds}
              onClose={hideFloatingToolbar}
            />
          </>
        ) : (
          <>
            <VirtualizedList
              ref={listRef}
              selectable="toggle"
              draggable
              atTopThreshold={80}
              atTopStateChange={setHideHeaderCreateNewPage}
              onSelectionActiveChange={setShowFloatingToolbar}
              heading={<PageListHeader />}
              selectedIds={filteredSelectedPageIds}
              onSelectedIdsChange={setSelectedPageIds}
              items={filteredPageMetas}
              rowAsLink
              isPreferredEdgeless={isPreferredEdgeless}
              blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
              operationsRenderer={pageOperationRenderer}
              itemRenderer={pageItemRenderer}
            />
            <PageListFloatingToolbar
              open={showFloatingToolbar && filteredSelectedPageIds.length > 0}
              selectedIds={filteredSelectedPageIds}
              onClose={hideFloatingToolbar}
            />
          </>
        )
      ) : (
        <EmptyPageList
          type="all"
          heading={<PageListHeader />}
          blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
        />
      )}
      {}
      <HubIsland />
    </div>
  );
};

export const Component = () => {
  performanceRenderLogger.info('AllPage');

  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const currentCollection = useSetAtom(currentCollectionAtom);
  const navigateHelper = useNavigateHelper();

  const location = useLocation();
  const activeFilter = useMemo(() => {
    const query = new URLSearchParams(location.search);
    const filterMode = query.get('filterMode');
    if (filterMode === 'collections') {
      return 'collections';
    } else if (filterMode === 'tags') {
      return 'tags';
    }
    return 'docs';
  }, [location.search]);

  useEffect(() => {
    function checkJumpOnce() {
      for (const [pageId] of currentWorkspace.blockSuiteWorkspace.pages) {
        const page = currentWorkspace.blockSuiteWorkspace.getPage(pageId);
        if (page && page.meta.jumpOnce) {
          currentWorkspace.blockSuiteWorkspace.meta.setPageMeta(page.id, {
            jumpOnce: false,
          });
          navigateHelper.jumpToPage(currentWorkspace.id, pageId);
        }
      }
    }
    checkJumpOnce();
    return currentWorkspace.blockSuiteWorkspace.slots.pagesUpdated.on(
      checkJumpOnce
    ).dispose;
  }, [
    currentWorkspace.blockSuiteWorkspace,
    currentWorkspace.id,
    navigateHelper,
  ]);

  useEffect(() => {
    currentCollection(NIL);
  }, [currentCollection]);

  return <AllPage activeFilter={activeFilter} />;
};
