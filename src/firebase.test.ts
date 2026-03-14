import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn(),
}));

// Use a factory function that defines the mock completely inside the mock setup
// Since vi.mock gets hoisted, it can't reference outer variables correctly unless they are hoisted too (via vi.hoisted)
const { mockAuth, mockCurrentUser } = vi.hoisted(() => {
  const currentUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    emailVerified: true,
    isAnonymous: false,
    tenantId: 'test-tenant',
    providerData: [
      {
        providerId: 'google.com',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      },
    ],
  };

  return {
    mockCurrentUser: currentUser,
    mockAuth: {
      currentUser: { ...currentUser },
    },
  };
});


vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
}));

import { handleFirestoreError, OperationType } from './firebase';

describe('handleFirestoreError', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockAuth.currentUser = { ...mockCurrentUser } as any;

    // Suppress console.error in tests to keep output clean,
    // but we can spy on it to ensure it's called.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('throws an error containing JSON stringified details for a standard Error', () => {
    const error = new Error('Permission denied');
    const operation = OperationType.GET;
    const path = 'users/123';

    expect(() => handleFirestoreError(error, operation, path)).toThrowError();

    try {
      handleFirestoreError(error, operation as OperationType, path);
    } catch (e: any) {
      const errInfo = JSON.parse(e.message);
      expect(errInfo.error).toBe('Permission denied');
      expect(errInfo.operationType).toBe(operation);
      expect(errInfo.path).toBe(path);
      expect(errInfo.authInfo.userId).toBe('test-user-id');
      expect(console.error).toHaveBeenCalled();
    }
  });

  it('handles a string error correctly', () => {
    const errorStr = 'String error message';

    try {
      handleFirestoreError(errorStr, OperationType.WRITE, null);
    } catch (e: any) {
      const errInfo = JSON.parse(e.message);
      expect(errInfo.error).toBe(errorStr);
      expect(errInfo.operationType).toBe(OperationType.WRITE);
      expect(errInfo.path).toBeNull();
    }
  });

  it('handles null auth user gracefully', () => {
    mockAuth.currentUser = null as any;

    try {
      handleFirestoreError(new Error('Test error'), OperationType.LIST, 'collection');
    } catch (e: any) {
      const errInfo = JSON.parse(e.message);
      expect(errInfo.authInfo.userId).toBeUndefined();
      expect(errInfo.authInfo.email).toBeUndefined();
      expect(errInfo.authInfo.providerInfo).toEqual([]);
    }
  });

  it('handles partial auth user correctly', () => {
    mockAuth.currentUser = { uid: 'test-user-id', providerData: [] } as any;

    try {
      handleFirestoreError(new Error('Test error'), OperationType.GET, 'collection/doc');
    } catch (e: any) {
      const errInfo = JSON.parse(e.message);
      expect(errInfo.authInfo.userId).toBe('test-user-id');
      expect(errInfo.authInfo.email).toBeUndefined();
      expect(errInfo.authInfo.providerInfo).toEqual([]);
    }
  });
});
