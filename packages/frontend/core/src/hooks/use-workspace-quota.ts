import { workspaceQuotaQuery } from '@affine/graphql';
import bytes from 'bytes';
import { useCallback } from 'react';

import { useQuery } from './use-query';

export const useWorkspaceQuota = (workspaceId: string) => {
  const { data } = useQuery({
    query: workspaceQuotaQuery,
    variables: {
      id: workspaceId,
    },
  });
  const changeToHumanReadable = useCallback((value: string | number) => {
    return bytes.format(bytes.parse(value));
  }, []);

  const quotaData = data.workspace.quota;
  const blobLimit = BigInt(quotaData.blobLimit);
  const storageQuota = BigInt(quotaData.storageQuota);
  const usedSize = BigInt(quotaData.usedSize);

  const humanReadableBlobLimit = changeToHumanReadable(quotaData.blobLimit);
  const humanReadableStorageQuota = changeToHumanReadable(
    quotaData.storageQuota
  );
  const humanReadableUsedSize = changeToHumanReadable(quotaData.usedSize);

  return {
    blobLimit,
    storageQuota,
    usedSize,
    humanReadable: {
      blobLimit: humanReadableBlobLimit,
      storageQuota: humanReadableStorageQuota,
      usedSize: humanReadableUsedSize,
    },
  };
};
