import { MainContainer } from '@affine/component/workspace';
import { usePageDocumentTitle } from '@affine/core/hooks/use-global-state';
import { DebugLogger } from '@affine/debug';
import { fetchWithTraceReport } from '@affine/graphql';
import {
  AffineCloudBlobStorage,
  StaticBlobStorage,
} from '@affine/workspace-impl';
import { assertExists } from '@blocksuite/global/utils';
import { type Page, Workspace } from '@blocksuite/store';
import { globalBlockSuiteSchema } from '@toeverything/infra';
import { noop } from 'foxact/noop';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import type { LoaderFunction } from 'react-router-dom';
import {
  isRouteErrorResponse,
  redirect,
  useLoaderData,
  useRouteError,
} from 'react-router-dom';
import { applyUpdate } from 'yjs';

import type { PageMode } from '../../atoms';
import { AppContainer } from '../../components/affine/app-container';
import { PageDetailEditor } from '../../components/page-detail-editor';
import { SharePageNotFoundError } from '../../components/share-page-not-found-error';
import { ShareHeader } from './share-header';

type DocPublishMode = 'edgeless' | 'page';

export type CloudDoc = {
  arrayBuffer: ArrayBuffer;
  publishMode: DocPublishMode;
};

export async function downloadBinaryFromCloud(
  rootGuid: string,
  pageGuid: string
): Promise<CloudDoc | null> {
  const response = await fetchWithTraceReport(
    `/api/workspaces/${rootGuid}/docs/${pageGuid}`,
    {
      priority: 'high',
    }
  );
  if (response.ok) {
    const publishMode = (response.headers.get('publish-mode') ||
      'page') as DocPublishMode;
    const arrayBuffer = await response.arrayBuffer();

    // return both arrayBuffer and publish mode
    return { arrayBuffer, publishMode };
  }

  return null;
}

type LoaderData = {
  page: Page;
  publishMode: PageMode;
};

function assertDownloadResponse(
  value: CloudDoc | null
): asserts value is CloudDoc {
  if (
    !value ||
    !((value as CloudDoc).arrayBuffer instanceof ArrayBuffer) ||
    typeof (value as CloudDoc).publishMode !== 'string'
  ) {
    throw new Error('value is not a valid download response');
  }
}

const logger = new DebugLogger('public:share-page');

export const loader: LoaderFunction = async ({ params }) => {
  const workspaceId = params?.workspaceId;
  const pageId = params?.pageId;
  if (!workspaceId || !pageId) {
    return redirect('/404');
  }
  const workspace = new Workspace({
    id: workspaceId,
    blobStorages: [
      () => ({
        crud: new AffineCloudBlobStorage(workspaceId),
      }),
      () => ({
        crud: new StaticBlobStorage(),
      }),
    ],
    schema: globalBlockSuiteSchema,
  });
  // download root workspace
  {
    const response = await downloadBinaryFromCloud(workspaceId, workspaceId);
    assertDownloadResponse(response);
    const { arrayBuffer } = response;
    applyUpdate(workspace.doc, new Uint8Array(arrayBuffer));
  }
  const page = workspace.getPage(pageId);
  assertExists(page, 'cannot find page');
  // download page

  const response = await downloadBinaryFromCloud(
    workspaceId,
    page.spaceDoc.guid
  );
  assertDownloadResponse(response);
  const { arrayBuffer, publishMode } = response;

  applyUpdate(page.spaceDoc, new Uint8Array(arrayBuffer));

  logger.info('workspace', workspace);
  workspace.awarenessStore.setReadonly(page, true);
  return { page, publishMode };
};

export const Component = (): ReactElement => {
  const { page, publishMode } = useLoaderData() as LoaderData;
  usePageDocumentTitle(page.meta);

  return (
    <AppContainer>
      <MainContainer>
        <ShareHeader
          pageId={page.id}
          publishMode={publishMode}
          blockSuiteWorkspace={page.workspace}
        />
        <PageDetailEditor
          isPublic
          publishMode={publishMode}
          workspace={page.workspace}
          pageId={page.id}
          onLoad={useCallback(() => noop, [])}
        />
      </MainContainer>
    </AppContainer>
  );
};

export function ErrorBoundary() {
  const error = useRouteError();
  return isRouteErrorResponse(error) ? (
    <h1>
      {error.status} {error.statusText}
    </h1>
  ) : (
    <SharePageNotFoundError />
  );
}
