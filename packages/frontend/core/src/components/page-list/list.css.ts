import { createContainer, style } from '@vanilla-extract/css';

import * as itemStyles from './docs/page-list-item.css';

export const listRootContainer = createContainer('list-root-container');

export const pageListScrollContainer = style({
  width: '100%',
  flex: 1,
});

export const root = style({
  width: '100%',
  maxWidth: '100%',
  containerName: listRootContainer,
  containerType: 'inline-size',
  background: 'var(--affine-background-primary-color)',
});

export const groupsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  rowGap: '16px',
});

export const heading = style({});

export const colWrapper = style({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  overflow: 'hidden',
});

export const hideInSmallContainer = style({
  '@container': {
    [`${listRootContainer} (max-width: 800px)`]: {
      display: 'none',
    },
  },
});

export const favoriteCell = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexShrink: 0,
  opacity: 0,
  selectors: {
    [`&[data-favorite], ${itemStyles.root}:hover &`]: {
      opacity: 1,
    },
  },
});

export const clearLinkStyle = style({
  color: 'inherit',
  textDecoration: 'none',
  ':visited': {
    color: 'inherit',
  },
  ':active': {
    color: 'inherit',
  },
});
