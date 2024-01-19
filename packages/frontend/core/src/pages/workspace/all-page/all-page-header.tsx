import { IconButton } from '@affine/component';
import type { AllPageFilterOption } from '@affine/core/atoms';
import { collectionsCRUDAtom } from '@affine/core/atoms/collections';
import {
  CollectionList,
  PageListNewPageButton,
  useCollectionManager,
} from '@affine/core/components/page-list';
import { Header } from '@affine/core/components/pure/header';
import { WindowsAppControls } from '@affine/core/components/pure/header/windows-app-controls';
import { WorkspaceModeFilterTab } from '@affine/core/components/pure/workspace-mode-filter-tab';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import { useDeleteCollectionInfo } from '@affine/core/hooks/affine/use-delete-collection-info';
import { PlusIcon } from '@blocksuite/icons';
import type { Workspace } from '@blocksuite/store';
import clsx from 'clsx';
import { useMemo } from 'react';

import * as styles from './all-page.css';
import { FilterContainer } from './all-page-filter';

export const AllPageHeader = ({
  workspace,
  showCreateNew,
  isDefaultFilter,
  activeFilter,
  onCreateCollection,
}: {
  workspace: Workspace;
  showCreateNew: boolean;
  isDefaultFilter: boolean;
  activeFilter: AllPageFilterOption;
  onCreateCollection: () => void;
}) => {
  const setting = useCollectionManager(collectionsCRUDAtom);
  const config = useAllPageListConfig();
  const userInfo = useDeleteCollectionInfo();
  const isWindowsDesktop = environment.isDesktop && environment.isWindows;

  const renderRightItem = useMemo(() => {
    if (activeFilter === 'collections' && isDefaultFilter) {
      return (
        <IconButton
          type="default"
          icon={<PlusIcon fontSize={16} />}
          onClick={onCreateCollection}
          className={clsx(
            styles.headerCreateNewButton,
            styles.headerCreateNewCollectionIconButton,
            !showCreateNew && styles.headerCreateNewButtonHidden
          )}
        />
      );
    }
    return (
      <PageListNewPageButton
        size="small"
        className={clsx(
          styles.headerCreateNewButton,
          !showCreateNew && styles.headerCreateNewButtonHidden
        )}
      >
        <PlusIcon />
      </PageListNewPageButton>
    );
  }, [activeFilter, isDefaultFilter, onCreateCollection, showCreateNew]);

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
          <div
            className={styles.headerRightWindows}
            data-is-windows-desktop={isWindowsDesktop}
          >
            {renderRightItem}
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
