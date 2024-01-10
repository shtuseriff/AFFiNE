import { Button } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';

import * as styles from './collection-list.css';

export const CollectionListHeader = () => {
  const t = useAFFiNEI18N();

  return (
    <div className={styles.allPagesHeader}>
      <div className={styles.allPagesHeaderTitle}>
        {t['com.affine.collections.header']()}
      </div>
      <Button>New Collection</Button>
    </div>
  );
};
