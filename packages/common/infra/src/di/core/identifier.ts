import { stableHash } from '../../utils/stable-hash';
import { DEFAULT_SERVICE_VARIANT } from './consts';
import type {
  ServiceIdentifier,
  ServiceIdentifierValue,
  ServiceVariant,
  Type,
} from './types';

export function createIdentifier<T>(
  name: string,
  variant: ServiceVariant = DEFAULT_SERVICE_VARIANT
): ServiceIdentifier<T> & ((variant: ServiceVariant) => ServiceIdentifier<T>) {
  return Object.assign(
    (variant: ServiceVariant) => {
      return createIdentifier<T>(name, variant);
    },
    {
      identifierName: name,
      variant,
    }
  ) as any;
}

export function createIdentifierFromConstructor<T>(
  target: Type<T>
): ServiceIdentifier<T> {
  return createIdentifier<T>(`${target.name}${stableHash(target)}`);
}

export function parseIdentifier(input: any): ServiceIdentifierValue {
  if (input.identifierName) {
    return input as ServiceIdentifierValue;
  } else if (typeof input === 'function' && input.name) {
    return createIdentifierFromConstructor(input);
  } else {
    throw new Error('Input is not a service identifier.');
  }
}
