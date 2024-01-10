import { RadioButton, RadioButtonGroup } from '@affine/component';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { WorkspaceSubPath } from '@affine/core/shared';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';

import type { AllPageFilterOption } from '../../../atoms';
import { allPageFilterSelectAtom } from '../../../atoms';
import * as styles from './index.css';

export const WorkspaceModeFilterTab = ({
  workspaceId,
  activeFilter,
}: {
  workspaceId: string;
  activeFilter: AllPageFilterOption;
}) => {
  const [value, setValue] = useState(activeFilter);
  const [filterMode, setFilterMode] = useAtom(allPageFilterSelectAtom);
  const { jumpToCollections, jumpToTags, jumpToSubPath } = useNavigateHelper();
  const handleValueChange = (value: AllPageFilterOption) => {
    switch (value) {
      case 'collections':
        jumpToCollections(workspaceId);
        break;
      case 'tags':
        jumpToTags(workspaceId);
        break;
      case 'docs':
        jumpToSubPath(workspaceId, WorkspaceSubPath.ALL);
        break;
    }
    setValue(value);
    setFilterMode(value);
  };

  useEffect(() => {
    if (filterMode !== value) {
      setFilterMode(activeFilter);
    }
  }, [activeFilter, filterMode, setFilterMode, value]);

  return (
    <RadioButtonGroup value={value} onValueChange={handleValueChange}>
      <RadioButton spanStyle={styles.filterTab} value="docs">
        Docs
      </RadioButton>
      <RadioButton spanStyle={styles.filterTab} value="collections">
        Collections
      </RadioButton>
      <RadioButton spanStyle={styles.filterTab} value="tags">
        Tags
      </RadioButton>
    </RadioButtonGroup>
  );
};
