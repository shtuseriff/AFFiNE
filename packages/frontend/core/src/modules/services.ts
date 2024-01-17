import {
  GlobalCache,
  type ServiceCollection,
  Workspace,
  WorkspaceScope,
} from '@toeverything/infra';

import { CollectionService } from './collection';
import { LocalStorageGlobalCache } from './infra-web/storage';
import { CurrentWorkspaceService } from './workspace';

export function configureBusinessServices(services: ServiceCollection) {
  services.add(CurrentWorkspaceService);
  services.scope(WorkspaceScope).add(CollectionService, [Workspace]);
}

export function configureWebInfraServices(services: ServiceCollection) {
  services.addImpl(GlobalCache, LocalStorageGlobalCache);
}
