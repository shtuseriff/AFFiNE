import {
  filterPage,
  filterPageByRules,
  useCollectionManager,
} from '@affine/core/components/page-list';
import { usePublicPages } from '@affine/core/hooks/affine/use-is-shared-page';
import type { Workspace } from '@affine/workspace/workspace';
import type { PageMeta } from '@blocksuite/store';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { allPageModeSelectAtom } from '../../atoms';
import { collectionsCRUDAtom } from '../../atoms/collections';
import { usePageHelper } from '../../components/blocksuite/block-suite-page-list/utils';

export const useFilteredPageMetas = (
  route: 'all' | 'trash',
  pageMetas: PageMeta[],
  workspace: Workspace
) => {
  const { isPreferredEdgeless } = usePageHelper(workspace.blockSuiteWorkspace);
  const pageMode = useAtomValue(allPageModeSelectAtom);
  const { currentCollection, isDefault } =
    useCollectionManager(collectionsCRUDAtom);
  const { getPublicMode } = usePublicPages(workspace);

  const filteredPageMetas = useMemo(
    () =>
      pageMetas
        .filter(pageMeta => {
          if (pageMode === 'all') {
            return true;
          }
          if (pageMode === 'edgeless') {
            return isPreferredEdgeless(pageMeta.id);
          }
          if (pageMode === 'page') {
            return !isPreferredEdgeless(pageMeta.id);
          }
          console.error('unknown filter mode', pageMeta, pageMode);
          return true;
        })
        .filter(pageMeta => {
          if (
            (route === 'trash' && !pageMeta.trash) ||
            (route === 'all' && pageMeta.trash)
          ) {
            return false;
          }
          if (!currentCollection) {
            return true;
          }
          const pageData = {
            meta: pageMeta,
            publicMode: getPublicMode(pageMeta.id),
          };
          return isDefault
            ? filterPageByRules(
                currentCollection.filterList,
                currentCollection.allowList,
                pageData
              )
            : filterPage(currentCollection, pageData);
        }),
    [
      currentCollection,
      isDefault,
      isPreferredEdgeless,
      getPublicMode,
      pageMetas,
      pageMode,
      route,
    ]
  );

  return filteredPageMetas;
};
