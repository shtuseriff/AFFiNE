import type { Page as BlockSuitePage } from '@blocksuite/store';
import { type PageMeta } from '@blocksuite/store';
import type { ServiceProvider } from '@toeverything/infra/di';

export class Page {
  constructor(
    public readonly pageMeta: PageMeta,
    public readonly blockSuitePage: BlockSuitePage,
    public readonly services: ServiceProvider
  ) {}
}
