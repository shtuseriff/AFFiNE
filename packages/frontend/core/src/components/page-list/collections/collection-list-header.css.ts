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

export const newCollectionButton = style({
  padding: '6px 10px',
  borderRadius: '8px',
  boxShadow: 'var(--affine-float-button-shadow)',
  background: 'var(--affine-background-primary-color)',
  fontSize: 'var(--affine-font-sm)',
  fontWeight: 600,
  height: '34px',
});
