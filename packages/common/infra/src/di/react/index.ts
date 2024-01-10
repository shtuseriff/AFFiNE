import { use } from 'foxact/use';
import React, { useContext } from 'react';

import type { ServiceProvider } from '../core';
import {
  type GeneralServiceIdentifier,
  ServiceCollection,
  ServiceNotFoundError,
  type ServiceVariant,
} from '../core';

export const ServiceProviderContext = React.createContext(
  ServiceCollection.EMPTY.provider()
);

export function useService<T>(
  identifier: GeneralServiceIdentifier<T>,
  { provider }: { variant?: ServiceVariant; provider?: ServiceProvider } = {}
): T {
  const contextServiceProvider = useContext(ServiceProviderContext);

  const serviceProvider = provider ?? contextServiceProvider;

  try {
    return serviceProvider.get(identifier);
  } catch (err) {
    if (err instanceof ServiceNotFoundError) {
      use(
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(err);
          }, 2000);
        })
      );
    }
    throw err;
  }
}
