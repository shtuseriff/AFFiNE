import { configureWorkspaceImplServices } from '@affine/workspace-impl';
import { configureInfraServices, ServiceCollection } from '@toeverything/infra';

import {
  configureBusinessServices,
  configureWebInfraServices,
} from './modules/services';

export function createWebServices() {
  const services = new ServiceCollection();

  configureInfraServices(services);
  configureWebInfraServices(services);
  configureBusinessServices(services);
  configureWorkspaceImplServices(services);

  return services;
}
