import type { AllPageFilterOption } from '@affine/core/atoms';
import { collectionsCRUDAtom } from '@affine/core/atoms/collections';
import { HubIsland } from '@affine/core/components/affine/hub-island';
import {
  CollectionListHeader,
  type CollectionMeta,
  createEmptyCollection,
  currentCollectionAtom,
  PageListHeader,
  useCollectionManager,
  useEditCollectionName,
  useFilteredPageMetas,
  useSavedCollections,
  VirtualizedCollectionList,
  VirtualizedPageList,
} from '@affine/core/components/page-list';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import { useBlockSuitePageMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import { performanceRenderLogger } from '@affine/core/shared';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useAtomValue, useSetAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NIL } from 'uuid';

import { EmptyCollectionList, EmptyPageList } from '../page-list-empty';
import * as styles from './all-page.css';
import { AllPageHeader } from './all-page-header';

//TODO: remove mock data

// even though it is called all page, it is also being used for collection route as well
export const AllPage = ({
  activeFilter,
}: {
  activeFilter: AllPageFilterOption;
}) => {
  const t = useAFFiNEI18N();
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const pageMetas = useBlockSuitePageMeta(currentWorkspace.blockSuiteWorkspace);

  const filteredPageMetas = useFilteredPageMetas(
    'all',
    pageMetas,
    currentWorkspace.blockSuiteWorkspace
  );

  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const setting = useCollectionManager(collectionsCRUDAtom);
  const config = useAllPageListConfig();
  const { collections } = useSavedCollections(collectionsCRUDAtom);

  const collectionMetas = useMemo(() => {
    const collectionsList: CollectionMeta[] = collections.map(collection => {
      return {
        ...collection,
        title: collection.name,
      };
    });
    return collectionsList;
  }, [collections]);

  const navigateHelper = useNavigateHelper();
  const { open, node } = useEditCollectionName({
    title: t['com.affine.editCollection.createCollection'](),
    showTips: true,
  });

  const handleCreateCollection = useCallback(() => {
    open('')
      .then(name => {
        const id = nanoid();
        setting.createCollection(createEmptyCollection(id, { name }));
        navigateHelper.jumpToCollection(currentWorkspace.id, id);
      })
      .catch(err => {
        console.error(err);
      });
  }, [currentWorkspace.id, navigateHelper, open, setting]);

  return (
    <div className={styles.root}>
      <AllPageHeader
        workspace={currentWorkspace.blockSuiteWorkspace}
        showCreateNew={!hideHeaderCreateNew}
        isDefaultFilter={setting.isDefault}
        activeFilter={activeFilter}
        onCreateCollection={handleCreateCollection}
      />
      {activeFilter === 'collections' && setting.isDefault ? (
        collectionMetas.length > 0 ? (
          <VirtualizedCollectionList
            collections={collections}
            collectionMetas={collectionMetas}
            setHideHeaderCreateNewCollection={setHideHeaderCreateNew}
            node={node}
            config={config}
            handleCreateCollection={handleCreateCollection}
          />
        ) : (
          <EmptyCollectionList
            heading={
              <CollectionListHeader
                node={node}
                onCreate={handleCreateCollection}
              />
            }
          />
        )
      ) : filteredPageMetas.length > 0 ? (
        <VirtualizedPageList
          setHideHeaderCreateNewPage={setHideHeaderCreateNew}
        />
      ) : (
        <EmptyPageList
          type="all"
          heading={<PageListHeader workspaceId={currentWorkspace.id} />}
          blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
        />
      )}
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
