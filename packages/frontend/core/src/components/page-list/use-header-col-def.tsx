import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useCallback, useMemo } from 'react';

import { ListHeaderTitleCell } from './page-header';
import type { HeaderColDef } from './types';

export const useHeaderColDef = () => {
  const t = useAFFiNEI18N();

  const pageHeaderColsDef = useCallback(
    (showOperations: boolean) => {
      const cols: (HeaderColDef | boolean)[] = [
        {
          key: 'title',
          content: <ListHeaderTitleCell />,
          flex: 6,
          alignment: 'start',
          sortable: true,
        },
        {
          key: 'tags',
          content: t['Tags'](),
          flex: 3,
          alignment: 'end',
        },
        {
          key: 'createDate',
          content: t['Created'](),
          flex: 1,
          sortable: true,
          alignment: 'end',
          hideInSmallContainer: true,
        },
        {
          key: 'updatedDate',
          content: t['Updated'](),
          flex: 1,
          sortable: true,
          alignment: 'end',
          hideInSmallContainer: true,
        },
        showOperations && {
          key: 'actions',
          content: '',
          flex: 1,
          alignment: 'end',
        },
      ];
      return cols.filter((def): def is HeaderColDef => !!def);
    },
    [t]
  );

  const collectionHeaderColsDef = useCallback((showOperations: boolean) => {
    const cols: (HeaderColDef | boolean)[] = [
      {
        key: 'title',
        content: <ListHeaderTitleCell />,
        flex: 8,
        alignment: 'start',
        sortable: true,
      },
      showOperations && {
        key: 'actions',
        content: '',
        flex: 1,
        alignment: 'end',
      },
    ];
    return cols.filter((def): def is HeaderColDef => !!def);
  }, []);
  return useMemo(() => {
    return {
      pageHeaderColsDef,
      collectionHeaderColsDef,
    };
  }, [collectionHeaderColsDef, pageHeaderColsDef]);
};
