import type { PageMeta } from '@blocksuite/store';

import type { ServiceProvider } from '../di';
import { ServiceCollection } from '../di';
import { CleanupService } from '../lifecycle';
import { ObjectPool, type RcRef } from '../utils/object-pool';
import type { Workspace } from '../workspace';
import { Page } from './page';
import { PageScope } from './service-scope';

export class PageManager {
  pool = new ObjectPool<string, Page>({});

  constructor(
    private readonly workspace: Workspace,
    private readonly serviceProvider: ServiceProvider
  ) {}

  open(pageMeta: PageMeta): RcRef<Page> {
    const blockSuitePage = this.workspace.blockSuiteWorkspace.getPage(
      pageMeta.id
    );
    if (!blockSuitePage) {
      throw new Error('Page not found');
    }

    const exists = this.pool.get(pageMeta.id);
    if (exists) {
      return exists;
    }

    const serviceCollection = this.serviceProvider
      .get(ServiceCollection)
      // avoid to modify the original service collection
      .clone();

    serviceCollection.add(CleanupService);

    const provider = serviceCollection.provider(
      PageScope,
      this.serviceProvider
    );

    const page = provider.get(Page);

    return this.pool.put(pageMeta.id, page);
  }
}
