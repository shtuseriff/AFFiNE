import { workspaceQuotaQuery } from '@affine/graphql';

import { useQuery } from './use-query';

export const useWorkspaceQuota = (workspaceId: string) => {
  const { data } = useQuery({
    query: workspaceQuotaQuery,
    variables: {
      id: workspaceId,
    },
  });
  return data.workspace.quota;
};
