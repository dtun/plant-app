// Mock LiveStore React hooks and components

export let LiveStoreProvider = ({ children }: { children: React.ReactNode }) => children;

export let useQuery = jest.fn(() => []);

export let useClientDocument = jest.fn(() => ({}));

export let useStore = jest.fn(() => ({ store: {} }));
