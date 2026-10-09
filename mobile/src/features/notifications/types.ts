export type EventGroup = 'replies' | 'mentions' | 'sessions' | 'payments';
export type Channel = 'email' | 'inApp' | 'sms';
export type GroupPrefs = Record<Channel, boolean>;
export type NotificationPrefs = Record<EventGroup, GroupPrefs>;

export interface NotificationPrefsResponse extends NotificationPrefs {}
export interface SaveNotificationPrefsPayload extends NotificationPrefs {}
