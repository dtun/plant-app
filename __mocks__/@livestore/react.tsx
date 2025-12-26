// Mock LiveStore React hooks and components

export const LiveStoreProvider = ({ children }: { children: React.ReactNode }) => children;

export const useQuery = jest.fn(() => []);

export const useClientDocument = jest.fn(() => ({}));

export const useStore = jest.fn(() => ({ store: {} }));
