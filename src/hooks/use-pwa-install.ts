'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  platforms: string[];
}

/**
 * Hook that captures the PWA beforeinstallprompt event so we can show a
 * custom "Install App" / "Download" button. On Android Chrome this triggers
 * the native install flow (adds to home screen as a standalone app).
 */
export function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect platform.
    const ua = navigator.userAgent;
    setIsAndroid(/android/i.test(ua));
    setIsIOS(/iphone|ipad|ipod/i.test(ua));

    // Check if already installed (standalone mode).
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone || iosStandalone);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    return choice.outcome === 'accepted';
  }, [installEvent]);

  return {
    canInstall: !!installEvent,
    installed,
    isAndroid,
    isIOS,
    promptInstall,
  };
}
