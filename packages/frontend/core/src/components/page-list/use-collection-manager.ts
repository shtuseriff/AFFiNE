import type {
  Collection,
  DeleteCollectionInfo,
  Filter,
  VariableMap,
} from '@affine/env/filter';
import type { PageMeta } from '@blocksuite/store';
import { type Atom, useAtom, useAtomValue } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { useCallback } from 'react';
import { NIL } from 'uuid';

import { evalFilterList } from './filter';

export const createEmptyCollection = (
  id: string,
  data?: Partial<Omit<Collection, 'id'>>
): Collection => {
  return {
    id,
    name: '',
    filterList: [],
    allowList: [],
    ...data,
  };
};
const defaultCollection: Collection = createEmptyCollection(NIL, {
  name: 'All',
});
const defaultCollectionAtom = atomWithReset<Collection>(defaultCollection);
export const currentCollectionAtom = atomWithReset<string>(NIL);

export type Updater<T> = (value: T) => T;
export type CollectionUpdater = Updater<Collection>;
export type CollectionsCRUD = {
  addCollection: (...collections: Collection[]) => void;
  collections: Collection[];
  updateCollection: (id: string, updater: CollectionUpdater) => void;
  deleteCollection: (info: DeleteCollectionInfo, ...ids: string[]) => void;
};
export type CollectionsCRUDAtom = Atom<
  Promise<CollectionsCRUD> | CollectionsCRUD
>;

export const useSavedCollections = (collectionAtom: CollectionsCRUDAtom) => {
  const [{ collections, addCollection, deleteCollection, updateCollection }] =
    useAtom(collectionAtom);
  const addPage = useCallback(
    (collectionId: string, pageId: string) => {
      updateCollection(collectionId, old => {
        return {
          ...old,
          allowList: [pageId, ...(old.allowList ?? [])],
        };
      });
    },
    [updateCollection]
  );
  return {
    collections,
    addCollection,
    updateCollection,
    deleteCollection,
    addPage,
  };
};

export const useCollectionManager = (collectionsAtom: CollectionsCRUDAtom) => {
  const {
    collections,
    updateCollection,
    addCollection,
    deleteCollection,
    addPage,
  } = useSavedCollections(collectionsAtom);
  const currentCollectionId = useAtomValue(currentCollectionAtom);
  const [defaultCollection, updateDefaultCollection] = useAtom(
    defaultCollectionAtom
  );
  const update = useCallback(
    (collection: Collection) => {
      if (collection.id === NIL) {
        updateDefaultCollection(collection);
      } else {
        updateCollection(collection.id, () => collection);
      }
    },
    [updateDefaultCollection, updateCollection]
  );
  const setTemporaryFilter = useCallback(
    (filterList: Filter[]) => {
      updateDefaultCollection({
        ...defaultCollection,
        filterList: filterList,
      });
    },
    [updateDefaultCollection, defaultCollection]
  );
  const currentCollection =
    currentCollectionId === NIL
      ? defaultCollection
      : collections.find(v => v.id === currentCollectionId) ??
        defaultCollection;

  return {
    currentCollection: currentCollection,
    savedCollections: collections,
    isDefault: currentCollectionId === NIL,

    // actions
    createCollection: addCollection,
    updateCollection: update,
    deleteCollection,
    addPage,
    setTemporaryFilter,
  };
};
export const filterByFilterList = (filterList: Filter[], varMap: VariableMap) =>
  evalFilterList(filterList, varMap);

export type PageDataForFilter = {
  meta: PageMeta;
  publicMode: undefined | 'page' | 'edgeless';
};

export const filterPage = (collection: Collection, page: PageDataForFilter) => {
  if (collection.filterList.length === 0) {
    return collection.allowList.includes(page.meta.id);
  }
  return filterPageByRules(collection.filterList, collection.allowList, page);
};
export const filterPageByRules = (
  rules: Filter[],
  allowList: string[],
  { meta, publicMode }: PageDataForFilter
) => {
  if (allowList?.includes(meta.id)) {
    return true;
  }
  return filterByFilterList(rules, {
    'Is Favourited': !!meta.favorite,
    'Is Public': !!publicMode,
    Created: meta.createDate,
    Updated: meta.updatedDate ?? meta.createDate,
    Tags: meta.tags,
  });
};
