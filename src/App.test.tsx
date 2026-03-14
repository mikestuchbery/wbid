import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';

// 1. Mock @google/genai
const mockGenerateContent = vi.hoisted(() => vi.fn());
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER'
    }
  };
});

// 2. Mock firebase/firestore
const mockAddDoc = vi.hoisted(() => vi.fn());
vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(() => 'mock-collection'),
    addDoc: mockAddDoc,
    query: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    where: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
  };
});

// 3. Mock firebase/auth
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn((auth, cb) => {
      // simulate unauthenticated user initially, or just call immediately
      cb(null);
      return vi.fn(); // unsubscribe
    }),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signOut: vi.fn()
  };
});

// 4. Mock ./firebase
vi.mock('./firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./firebase')>();
  return {
    ...actual,
    db: {},
    auth: { currentUser: null },
    handleFirestoreError: vi.fn()
  };
});

import { handleFirestoreError } from './firebase';

describe('App Analysis Fallback Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
      writable: true
    });

    // Mock HTMLCanvasElement.toDataURL
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn()
    }) as any;
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mockdata');

    // Mock localStorage
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });

    // Mock console.error to avoid noisy test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('falls back to local storage when addDoc fails after analyzeImage', async () => {
    render(<App />);

    // 1. Click "Identify Landmark" to open camera
    const identifyLandmarkBtn = screen.getByText('Identify Landmark');
    fireEvent.click(identifyLandmarkBtn);

    // Wait for camera view to render and the "Capture Photo" button to appear
    const captureBtn = await screen.findByLabelText('Capture Photo');

    // 2. Click capture button to set `image` state and close camera
    fireEvent.click(captureBtn);

    // Wait for the "Identify" button (which triggers analyzeImage) to appear
    const identifyBtn = await screen.findByRole('button', { name: /identify/i });

    // Prepare mocks for analyzeImage
    const dummyAiResponse = {
      name: 'Test Castle',
      date: '1200',
      category: 'Medieval',
      history: 'A grand old castle.',
      coordinates: { lat: 50.0, lng: 10.0 }
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(dummyAiResponse)
    });

    // Force addDoc to reject
    const saveError = new Error('Simulated addDoc error');
    mockAddDoc.mockRejectedValueOnce(saveError);

    // 3. Click Identify
    fireEvent.click(identifyBtn);

    // 4. Assertions
    // Wait for the AI call to have happened
    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    // Wait for addDoc to have been called and rejected
    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });

    // Ensure fallback logic ran
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Auto-save failed, falling back to local:",
        saveError
      );

      expect(handleFirestoreError).toHaveBeenCalledWith(
        saveError,
        'create', // OperationType.CREATE
        'saved_landmarks'
      );

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wbid_local_chronicle',
        expect.stringContaining('Test Castle')
      );
    });
  });
});
