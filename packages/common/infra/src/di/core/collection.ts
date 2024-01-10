import { DEFAULT_SERVICE_VARIANT, ROOT_SCOPE } from './consts';
import { DuplicateServiceDefinitionError } from './error';
import { parseIdentifier } from './identifier';
import type { ServiceProvider } from './provider';
import { BasicServiceProvider } from './provider';
import { stringifyScope } from './scope';
import type {
  GeneralServiceIdentifier,
  ServiceFactory,
  ServiceIdentifier,
  ServiceIdentifierType,
  ServiceIdentifierValue,
  ServiceScope,
  ServiceVariant,
  Type,
  TypesToDeps,
} from './types';

/**
 * A collection of services.
 *
 * ServiceCollection basically is a tuple of [scope, identifier, variant, factory] with some helper methods.
 * It just stores the definitions of services. It never holds any instances of services.
 */
export class ServiceCollection {
  // tuple [scope, identifier, variant, factory]
  private readonly services: Map<
    string,
    Map<string, Map<ServiceVariant, ServiceFactory>>
  > = new Map();

  constructor() {
    this.addValue(ServiceCollection, this);
  }

  static get EMPTY() {
    return new ServiceCollection();
  }

  get add() {
    return new ServiceCollectionEditor(this).add;
  }

  get addImpl() {
    return new ServiceCollectionEditor(this).addImpl;
  }

  get scope() {
    return new ServiceCollectionEditor(this).scope;
  }

  addValue<T>(
    identifier: GeneralServiceIdentifier<T>,
    value: T,
    { scope, override }: { scope?: ServiceScope; override?: boolean } = {}
  ) {
    this.addFactory(
      parseIdentifier(identifier) as ServiceIdentifier<T>,
      () => value,
      {
        scope,
        override,
      }
    );
  }

  addFactory<T>(
    identifier: GeneralServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    { scope, override }: { scope?: ServiceScope; override?: boolean } = {}
  ) {
    const normalizedScope = stringifyScope(scope ?? ROOT_SCOPE);
    const normalizedIdentifier = parseIdentifier(identifier);
    const normalizedVariant =
      normalizedIdentifier.variant ?? DEFAULT_SERVICE_VARIANT;

    const services =
      this.services.get(normalizedScope) ??
      new Map<string, Map<ServiceVariant, ServiceFactory>>();

    const variants =
      services.get(normalizedIdentifier.identifierName) ??
      new Map<ServiceVariant, ServiceFactory>();

    if (variants.has(normalizedVariant) && !override) {
      throw new DuplicateServiceDefinitionError(normalizedIdentifier);
    }
    variants.set(normalizedVariant, factory);
    services.set(normalizedIdentifier.identifierName, variants);
    this.services.set(normalizedScope, services);
  }

  provider(
    scope: ServiceScope = ROOT_SCOPE,
    parent: ServiceProvider | null = null
  ): ServiceProvider {
    return new BasicServiceProvider(this, scope, parent);
  }

  getFactory(
    identifier: ServiceIdentifierValue,
    scope: ServiceScope = ROOT_SCOPE
  ): ServiceFactory | undefined {
    return this.services
      .get(stringifyScope(scope))
      ?.get(identifier.identifierName)
      ?.get(identifier.variant ?? DEFAULT_SERVICE_VARIANT);
  }

  getFactoryAll(
    identifier: ServiceIdentifierValue,
    scope: ServiceScope = ROOT_SCOPE
  ): Map<ServiceVariant, ServiceFactory> {
    return new Map(
      this.services.get(stringifyScope(scope))?.get(identifier.identifierName)
    );
  }

  /**
   * Clone the entire service collection.
   *
   * This method is quite cheap as it only clones the references.
   *
   * @returns A new service collection with the same services.
   */
  clone(): ServiceCollection {
    const di = new ServiceCollection();
    for (const [scope, identifiers] of this.services) {
      const s = new Map();
      for (const [identifier, variants] of identifiers) {
        s.set(identifier, new Map(variants));
      }
      di.services.set(scope, s);
    }
    return di;
  }
}

class ServiceCollectionEditor {
  private currentScope: ServiceScope = ROOT_SCOPE;

  constructor(private readonly collection: ServiceCollection) {}

  add = <
    T extends new (...args: any) => any,
    const Deps extends TypesToDeps<ConstructorParameters<T>> = TypesToDeps<
      ConstructorParameters<T>
    >,
  >(
    cls: T,
    ...[deps]: Deps extends [] ? [] : [Deps]
  ): this => {
    this.collection.addFactory<any>(
      cls as any,
      dependenciesToFactory(cls, deps as any),
      { scope: this.currentScope }
    );

    return this;
  };

  addImpl = <
    Arg1 extends ServiceIdentifier<any>,
    Arg2 extends Type<Trait> | ServiceFactory<Trait> | Trait,
    Trait = ServiceIdentifierType<Arg1>,
    Deps extends Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [] = Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [],
    Arg3 extends Deps = Deps,
  >(
    identifier: Arg1,
    arg2: Arg2,
    ...[arg3]: Arg3 extends [] ? [] : [Arg3]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(
        identifier,
        dependenciesToFactory(arg2, arg3 as any[]),
        { scope: this.currentScope }
      );
    } else {
      this.collection.addValue(identifier, arg2 as any, {
        scope: this.currentScope,
      });
    }

    return this;
  };

  override = <
    Arg1 extends ServiceIdentifier<any>,
    Arg2 extends Type<Trait> | ServiceFactory<Trait> | Trait,
    Trait = ServiceIdentifierType<Arg1>,
    Deps extends Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [] = Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [],
    Arg3 extends Deps = Deps,
  >(
    identifier: Arg1,
    arg2: Arg2,
    ...[arg3]: Arg3 extends [] ? [] : [Arg3]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(
        identifier,
        dependenciesToFactory(arg2, arg3 as any[]),
        { scope: this.currentScope, override: true }
      );
    } else {
      this.collection.addValue(identifier, arg2 as any, {
        scope: this.currentScope,
        override: true,
      });
    }

    return this;
  };

  scope = (scope: ServiceScope): ServiceCollectionEditor => {
    this.currentScope = scope;
    return this;
  };
}

function parseDependency(dependency: any): {
  isAll: boolean;
  identifier: GeneralServiceIdentifier<any>;
} {
  if (Array.isArray(dependency)) {
    if (dependency.length !== 1) {
      throw new Error('Invalid dependency');
    }
    return {
      isAll: true,
      identifier: dependency[0],
    };
  } else {
    return {
      isAll: false,
      identifier: dependency,
    };
  }
}

function dependenciesToFactory(cls: any, deps: any[] = []) {
  return (provider: ServiceProvider) => {
    const args = [];
    for (const dep of deps) {
      const { identifier, isAll } = parseDependency(dep);
      if (isAll) {
        args.push(Array.from(provider.getAll(identifier).values()));
      } else {
        args.push(provider.get(identifier));
      }
    }
    if (isConstructor(cls)) {
      return new cls(...args, provider);
    } else {
      return cls(...args, provider);
    }
  };
}

// a hack to check if a function is a constructor
// https://github.com/zloirock/core-js/blob/232c8462c26c75864b4397b7f643a4f57c6981d5/packages/core-js/internals/is-constructor.js#L15
function isConstructor(cls: any) {
  try {
    Reflect.construct(function () {}, [], cls);
    return true;
  } catch (error) {
    return false;
  }
}
