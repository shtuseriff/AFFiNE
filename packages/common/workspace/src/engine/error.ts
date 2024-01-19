export class BlobStorageOverCapacity extends Error {
  constructor(
    public override readonly message: string,
    public readonly path: string[],
    public readonly extensions: {
      status: string;
      code: number;
      stacktrace: string[];
    }
  ) {
    super(message);
    this.name = 'BlobStorageOverCapacity';
  }
}
