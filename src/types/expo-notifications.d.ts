declare module 'expo-notifications' {
  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;
  export function getPermissionsAsync(): Promise<{ granted: boolean; canAskAgain?: boolean }>;
  export function requestPermissionsAsync(): Promise<{ granted: boolean }>;
  export function setNotificationChannelAsync(
    channelId: string,
    channel: { name: string; importance: number; sound?: string },
  ): Promise<unknown>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string; type: 'expo' }>;
  export function addNotificationResponseReceivedListener(
    listener: (response: {
      notification: { request: { content: { data: Record<string, unknown> } } };
    }) => void,
  ): { remove(): void };
  export function getLastNotificationResponseAsync(): Promise<{
    notification: { request: { content: { data: Record<string, unknown> } } };
  } | null>;
}
