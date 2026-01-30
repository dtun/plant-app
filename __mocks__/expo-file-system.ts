// Mock for expo-file-system

let mockFileContents = new Map<string, string>();

export class Directory {
  uri: string;

  constructor(...paths: string[]) {
    this.uri = paths.join("/");
  }
}

export class File {
  uri: string;

  constructor(...paths: (string | File | Directory)[]) {
    this.uri = paths
      .map((p) => {
        if (typeof p === "string") return p;
        return p.uri;
      })
      .join("/");
  }

  get exists(): boolean {
    return mockFileContents.has(this.uri);
  }

  async text(): Promise<string> {
    let content = mockFileContents.get(this.uri);
    if (content === undefined) {
      throw new Error("File does not exist");
    }
    return content;
  }

  write(content: string, _options: object): void {
    mockFileContents.set(this.uri, content);
  }

  delete(): void {
    mockFileContents.delete(this.uri);
  }
}

// Create document and cache directories
let documentDir = new Directory("file:///mock-document-directory");
let cacheDir = new Directory("file:///mock-cache-directory");

export let Paths = {
  document: documentDir,
  cache: cacheDir,
};

// Helper function for tests to reset state
export function __resetMockFileSystem(): void {
  mockFileContents.clear();
}

// Helper function for tests to set file contents
export function __setMockFileContent(uri: string, content: string): void {
  mockFileContents.set(uri, content);
}
