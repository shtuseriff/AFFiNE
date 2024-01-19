import { style } from '@vanilla-extract/css';

export const allPagesHeader = style({
  height: 100,
  alignItems: 'center',
  padding: '48px 16px 20px 24px',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'space-between',
  background: 'var(--affine-background-primary-color)',
});

export const allPagesHeaderTitle = style({
  fontSize: 'var(--affine-font-h-5)',
  fontWeight: 500,
  color: 'var(--affine-text-secondary-color)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const titleIcon = style({
  color: 'var(--affine-icon-color)',
  display: 'inline-flex',
  alignItems: 'center',
});

export const titleCollectionName = style({
  color: 'var(--affine-text-primary-color)',
});
