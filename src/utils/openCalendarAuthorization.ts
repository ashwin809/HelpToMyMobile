interface AuthorizationWindow {
  opener: unknown;
  closed: boolean;
  location: { replace(url: string): void };
  close(): void;
}

interface AuthorizationBrowser {
  open(url: string, target: string): AuthorizationWindow | null;
}

// Reserve the browser tab during the click, before an API request loses the
// browser's user activation. Linking.openURL cannot report blocked web popups.
export async function openCalendarAuthorization(
  getAuthorizationUrl: () => Promise<string | null>,
  openExternalUrl: (url: string) => Promise<unknown>,
  browser?: AuthorizationBrowser,
): Promise<void> {
  const tab = browser?.open('about:blank', '_blank');
  if (browser && !tab) {
    throw new Error('Allow pop-ups for HelpToYou, then tap Connect Google Calendar again.');
  }
  try {
    if (tab) tab.opener = null;
    const url = await getAuthorizationUrl();
    if (!url) {
      tab?.close();
      return;
    }
    if (tab) {
      if (tab.closed) throw new Error('The Google sign-in tab was closed. Tap Connect Google Calendar to try again.');
      tab.location.replace(url);
    } else {
      await openExternalUrl(url);
    }
  } catch (error) {
    tab?.close();
    throw error;
  }
}
