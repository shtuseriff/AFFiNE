import { style } from '@vanilla-extract/css';

export const floatingToolbar = style({
  position: 'absolute',
  bottom: 26,
  width: '100%',
  zIndex: 1,
});

export const toolbarSelectedNumber = style({
  color: 'var(--affine-text-secondary-color)',
});
