import { Empty } from '@affine/component';
import type { Collection } from '@affine/env/filter';
import { type LoaderFunction, redirect, useParams } from 'react-router-dom';

import { AllPage } from './all-page/all-page';

export const loader: LoaderFunction = async args => {
  if (!args.params.tagId) {
    return redirect('/404');
  }
  return null;
};

export const Component = function TagPage() {
  const params = useParams();
  console.log('params', params.tagId);

  return isEmpty() ? <Empty /> : <AllPage activeFilter="tags" />;
};

const isEmpty = (collection?: Collection) => {
  return (
    collection?.allowList.length === 0 && collection.filterList.length === 0
  );
};
