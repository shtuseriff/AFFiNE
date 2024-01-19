import { collectionsCRUDAtom } from '@affine/core/atoms/collections';
import { useDeleteCollectionInfo } from '@affine/core/hooks/affine/use-delete-collection-info';
import { waitForCurrentWorkspaceAtom } from '@affine/core/modules/workspace';
import type { Collection, DeleteCollectionInfo } from '@affine/env/filter';
import { useAtomValue } from 'jotai';
import {
  type ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CollectionOperationCell } from '../operation-cell';
import { CollectionListItemRenderer } from '../page-group';
import { ListTableHeader } from '../page-header';
import type { CollectionMeta, ItemListHandle, ListItem } from '../types';
import { useCollectionManager } from '../use-collection-manager';
import { useHeaderColDef } from '../use-header-col-def';
import type { AllPageListConfig } from '../view';
import { VirtualizedList } from '../virtualized-list';
import { CollectionListFloatingToolbar } from './collection-list-floating-toolbar';
import { CollectionListHeader } from './collection-list-header';

const useCollectionOperationsRenderer = ({
  info,
  setting,
  config,
}: {
  info: DeleteCollectionInfo;
  config: AllPageListConfig;
  setting: ReturnType<typeof useCollectionManager>;
}) => {
  const pageOperationsRenderer = useCallback(
    (collection: Collection) => {
      return (
        <CollectionOperationCell
          info={info}
          collection={collection}
          setting={setting}
          config={config}
        />
      );
    },
    [config, info, setting]
  );

  return pageOperationsRenderer;
};

export const VirtualizedCollectionList = ({
  collections,
  collectionMetas,
  setHideHeaderCreateNewCollection,
  node,
  handleCreateCollection,
  config,
}: {
  collections: Collection[];
  collectionMetas: CollectionMeta[];
  config: AllPageListConfig;
  node: ReactElement | null;
  handleCreateCollection: () => void;
  setHideHeaderCreateNewCollection: (hide: boolean) => void;
}) => {
  const listRef = useRef<ItemListHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    []
  );
  const setting = useCollectionManager(collectionsCRUDAtom);
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const info = useDeleteCollectionInfo();

  const { collectionHeaderColsDef } = useHeaderColDef();
  const collectionOperations = useCollectionOperationsRenderer({
    info,
    setting,
    config,
  });

  const collectionHeaderCols = useMemo(
    () => collectionHeaderColsDef(true),
    [collectionHeaderColsDef]
  );

  const filteredSelectedCollectionIds = useMemo(() => {
    const ids = collections.map(collection => collection.id);
    return selectedCollectionIds.filter(id => ids.includes(id));
  }, [collections, selectedCollectionIds]);

  const hideFloatingToolbar = useCallback(() => {
    listRef.current?.toggleSelectable();
  }, []);

  const collectionOperationRenderer = useCallback(
    (item: ListItem) => {
      const collection = item as CollectionMeta;
      return collectionOperations(collection);
    },
    [collectionOperations]
  );

  const collectionHeaderRenderer = useCallback(() => {
    return <ListTableHeader headerCols={collectionHeaderCols} />;
  }, [collectionHeaderCols]);

  const collectionItemRenderer = useCallback((item: ListItem) => {
    return <CollectionListItemRenderer {...item} />;
  }, []);

  return (
    <>
      <VirtualizedList
        ref={listRef}
        selectable="toggle"
        draggable={false}
        groupBy={false}
        atTopThreshold={80}
        atTopStateChange={setHideHeaderCreateNewCollection}
        onSelectionActiveChange={setShowFloatingToolbar}
        heading={
          <CollectionListHeader node={node} onCreate={handleCreateCollection} />
        }
        selectedIds={filteredSelectedCollectionIds}
        onSelectedIdsChange={setSelectedCollectionIds}
        items={collectionMetas}
        itemRenderer={collectionItemRenderer}
        rowAsLink
        blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
        operationsRenderer={collectionOperationRenderer}
        headerRenderer={collectionHeaderRenderer}
      />
      <CollectionListFloatingToolbar
        open={showFloatingToolbar && selectedCollectionIds.length > 0}
        selectedIds={selectedCollectionIds}
        onClose={hideFloatingToolbar}
        setting={setting}
        info={info}
      />
    </>
  );
};
