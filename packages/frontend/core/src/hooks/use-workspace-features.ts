import { WorkspaceFlavour } from '@affine/env/workspace';
import type { FeatureType } from '@affine/graphql';
import {
  availableFeaturesQuery,
  enabledFeaturesQuery,
  setWorkspaceExperimentalFeatureMutation,
} from '@affine/graphql';
import { useService, Workspace } from '@toeverything/infra';

import { useAsyncCallback } from './affine-async-hooks';
import { useMutateQueryResource, useMutation } from './use-mutation';
import { useQueryImmutable } from './use-query';

const emptyFeatures: FeatureType[] = [];

export const useWorkspaceAvailableFeatures = () => {
  const currentWorkspace = useService(Workspace);
  const isCloudWorkspace =
    currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD;
  const { data } = useQueryImmutable(
    isCloudWorkspace
      ? {
          query: availableFeaturesQuery,
          variables: {
            id: currentWorkspace.id,
          },
        }
      : undefined
  );
  return data?.workspace.availableFeatures ?? emptyFeatures;
};

export const useWorkspaceEnabledFeatures = () => {
  const currentWorkspace = useService(Workspace);
  const isCloudWorkspace =
    currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD;
  const { data } = useQueryImmutable(
    isCloudWorkspace
      ? {
          query: enabledFeaturesQuery,
          variables: {
            id: currentWorkspace.id,
          },
        }
      : undefined
  );
  return data?.workspace.features ?? emptyFeatures;
};

export const useSetWorkspaceFeature = () => {
  const currentWorkspace = useService(Workspace);
  const { trigger, isMutating } = useMutation({
    mutation: setWorkspaceExperimentalFeatureMutation,
  });
  const revalidate = useMutateQueryResource();

  return {
    trigger: useAsyncCallback(
      async (feature: FeatureType, enable: boolean) => {
        await trigger({
          workspaceId: currentWorkspace.id,
          feature,
          enable,
        });
        await revalidate(enabledFeaturesQuery, vars => {
          return vars.id === currentWorkspace.id;
        });
      },
      [currentWorkspace.id, revalidate, trigger]
    ),
    isMutating,
  };
};
