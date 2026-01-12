/**
 * Track Player Service
 * =====================
 * Handles initialization of react-native-track-player
 * Prevents multiple initialization errors
 */

import TrackPlayer, { Capability } from 'react-native-track-player';

/**
 * Some libraries (including Quran readers) may call `TrackPlayer.setupPlayer()` internally.
 * When the player is already initialized, TrackPlayer throws and the promise rejection can
 * show up as "Uncaught (in promise)" in the console.
 *
 * This patch makes `setupPlayer()` idempotent globally by swallowing the specific
 * "already been initialized" error. It protects *all* callers (including node_modules).
 */
function installGlobalSetupPlayerPatch() {
  const g = globalThis as any;
  if (g.__umar_trackplayer_setup_patch_installed) return;
  g.__umar_trackplayer_setup_patch_installed = true;

  const originalSetup = TrackPlayer.setupPlayer.bind(TrackPlayer);

  (TrackPlayer as any).setupPlayer = async (...args: any[]) => {
    try {
      return await originalSetup(...args);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('already been initialized')) {
        return;
      }
      throw error;
    }
  };
}

installGlobalSetupPlayerPatch();

let isInitialized = false;
let setupPromise: Promise<void> | null = null;

export async function setupPlayer() {
  // Return existing setup promise if already in progress
  if (setupPromise) {
    return setupPromise;
  }

  // Already initialized, do nothing
  if (isInitialized) {
    console.log('Track player already initialized');
    return Promise.resolve();
  }

  setupPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
      
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
      });

      isInitialized = true;
      console.log('Track player initialized successfully');
    } catch (error: any) {
      // Silently handle if already initialized
      const errorMsg = error?.message || '';
      if (errorMsg.includes('already been initialized') || errorMsg.includes('setupPlayer')) {
        console.log('Track player already initialized, skipping...');
        isInitialized = true;
      } else {
        console.warn('Track player setup error:', error);
      }
    } finally {
      setupPromise = null;
    }
  })();

  return setupPromise;
}

export function resetPlayer() {
  isInitialized = false;
  setupPromise = null;
}
