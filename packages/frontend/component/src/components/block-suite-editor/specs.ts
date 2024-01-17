import {
  AttachmentService,
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
} from '@blocksuite/blocks';
import bytes from 'bytes';

class CustomAttachmentService extends AttachmentService {
  override mounted(): void {
    // blocksuite default max file size is 10MB, we override it to 200MB
    // but the real place to limit blob size is CloudQuotaModal / LocalQuotaModal
    this.maxFileSize = bytes.parse('200MB');
  }
}

function getSpecs() {
  const docModeSpecs = DocEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:attachment') {
      return {
        ...spec,
        service: CustomAttachmentService,
      };
    }
    return spec;
  });
  const edgelessModeSpecs = EdgelessEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:attachment') {
      return {
        ...spec,
        service: CustomAttachmentService,
      };
    }
    return spec;
  });

  return {
    docModeSpecs,
    edgelessModeSpecs,
  };
}

export const editorSpecs = getSpecs();
