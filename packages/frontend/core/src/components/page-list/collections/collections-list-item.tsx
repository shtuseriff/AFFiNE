import { Checkbox } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useDraggable } from '@dnd-kit/core';
import { type PropsWithChildren, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import type {
  CollectionListItemProps,
  DraggableTitleCellData,
  PageListItemProps,
} from '../types';
import { ColWrapper, formatDate, stopPropagation } from '../utils';
import * as styles from './collections-list-item.css';

const ListTitleCell = ({
  title,
  preview,
}: Pick<PageListItemProps, 'title' | 'preview'>) => {
  const t = useAFFiNEI18N();
  return (
    <div data-testid="page-list-item-title" className={styles.titleCell}>
      <div
        data-testid="page-list-item-title-text"
        className={styles.titleCellMain}
      >
        {title || t['Untitled']()}
      </div>
      {preview ? (
        <div
          data-testid="page-list-item-preview-text"
          className={styles.titleCellPreview}
        >
          {preview}
        </div>
      ) : null}
    </div>
  );
};

const ListIconCell = ({ icon }: Pick<PageListItemProps, 'icon'>) => {
  return (
    <div data-testid="page-list-item-icon" className={styles.iconCell}>
      {icon}
    </div>
  );
};

const CollectionSelectionCell = ({
  selectable,
  onSelectedChange,
  selected,
}: Pick<
  CollectionListItemProps,
  'selectable' | 'onSelectedChange' | 'selected'
>) => {
  const onSelectionChange = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>) => {
      return onSelectedChange?.();
    },
    [onSelectedChange]
  );
  if (!selectable) {
    return null;
  }
  return (
    <div className={styles.selectionCell}>
      <Checkbox
        onClick={stopPropagation}
        checked={!!selected}
        onChange={onSelectionChange}
      />
    </div>
  );
};

const CollectionCreateDateCell = ({
  createDate,
}: Pick<CollectionListItemProps, 'createDate'>) => {
  return (
    <div
      data-testid="page-list-item-date"
      data-date-raw={createDate}
      className={styles.dateCell}
    >
      {formatDate(createDate)}
    </div>
  );
};

const CollectionUpdatedDateCell = ({
  updatedDate,
}: Pick<CollectionListItemProps, 'updatedDate'>) => {
  return (
    <div
      data-testid="page-list-item-date"
      data-date-raw={updatedDate}
      className={styles.dateCell}
    >
      {updatedDate ? formatDate(updatedDate) : '-'}
    </div>
  );
};

const CollectionListOperationsCell = ({
  operations,
}: Pick<CollectionListItemProps, 'operations'>) => {
  return operations ? (
    <div onClick={stopPropagation} className={styles.operationsCell}>
      {operations}
    </div>
  ) : null;
};

export const CollectionListItem = (props: CollectionListItemProps) => {
  const collectionTitleElement = useMemo(() => {
    return (
      <div className={styles.dragPageItemOverlay}>
        <div className={styles.titleIconsWrapper}>
          <CollectionSelectionCell
            onSelectedChange={props.onSelectedChange}
            selectable={props.selectable}
            selected={props.selected}
          />
          <ListIconCell icon={props.icon} />
        </div>
      </div>
    );
  }, [props.icon, props.onSelectedChange, props.selectable, props.selected]);

  // TODO: use getDropItemId
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: 'collection-list-item-title-' + props.collectionId,
    data: {
      pageId: props.collectionId,
      pageTitle: collectionTitleElement,
    } satisfies DraggableTitleCellData,
    disabled: !props.draggable,
  });

  return (
    <CollectionListItemWrapper
      onClick={props.onClick}
      to={props.to}
      collectionId={props.collectionId}
      draggable={props.draggable}
      isDragging={isDragging}
    >
      <ColWrapper flex={9}>
        <ColWrapper
          className={styles.dndCell}
          flex={8}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <div className={styles.titleIconsWrapper}>
            <CollectionSelectionCell
              onSelectedChange={props.onSelectedChange}
              selectable={props.selectable}
              selected={props.selected}
            />
            <ListIconCell icon={props.icon} />
          </div>
          <ListTitleCell title={props.title} />
        </ColWrapper>
        <ColWrapper
          flex={4}
          alignment="end"
          style={{ overflow: 'visible' }}
        ></ColWrapper>
      </ColWrapper>
      <ColWrapper flex={1} alignment="end" hideInSmallContainer>
        <CollectionCreateDateCell createDate={props.createDate} />
      </ColWrapper>
      <ColWrapper flex={1} alignment="end" hideInSmallContainer>
        <CollectionUpdatedDateCell updatedDate={props.updatedDate} />
      </ColWrapper>
      {props.operations ? (
        <ColWrapper
          className={styles.actionsCellWrapper}
          flex={1}
          alignment="end"
        >
          <CollectionListOperationsCell operations={props.operations} />
        </ColWrapper>
      ) : null}
    </CollectionListItemWrapper>
  );
};

type collectionListWrapperProps = PropsWithChildren<
  Pick<
    CollectionListItemProps,
    'to' | 'collectionId' | 'onClick' | 'draggable'
  > & {
    isDragging: boolean;
  }
>;

function CollectionListItemWrapper({
  to,
  isDragging,
  collectionId,
  onClick,
  children,
  draggable,
}: collectionListWrapperProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClick) {
        stopPropagation(e);
        onClick();
      }
    },
    [onClick]
  );

  const commonProps = useMemo(
    () => ({
      'data-testid': 'collection-list-item',
      'data-collection-id': collectionId,
      'data-draggable': draggable,
      className: styles.root,
      'data-clickable': !!onClick || !!to,
      'data-dragging': isDragging,
      onClick: handleClick,
    }),
    [collectionId, draggable, isDragging, onClick, to, handleClick]
  );

  if (to) {
    return (
      <Link {...commonProps} to={to}>
        {children}
      </Link>
    );
  } else {
    return <div {...commonProps}>{children}</div>;
  }
}

export const CollectionListDragOverlay = ({
  children,
  over,
}: PropsWithChildren<{
  over?: boolean;
}>) => {
  return (
    <div data-over={over} className={styles.dragOverlay}>
      {children}
    </div>
  );
};
