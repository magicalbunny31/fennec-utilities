interface Notification {
   "content":    string;
   "created-at": import("@google-cloud/firestore").Timestamp;
   "expires-at": import("@google-cloud/firestore").Timestamp;
};

type NotificationAlert        =      Notification;
type NotificationAnnouncement = Omit<Notification, "expires-at">;
type NotificationMaintenance  = Omit<Notification, "expires-at">;
type NotificationOfflineSoon  = Omit<Notification, "expires-at">;

export type NotificationType = "alert" | "announcement" | "blacklist" | "maintenance" | "offline-soon";

export type NotificationReturnType<T> =
   T extends "alert"        ? NotificationAlert        :
   T extends "announcement" ? NotificationAnnouncement :
   T extends "maintenance"  ? NotificationMaintenance  :
   T extends "offline-soon" ? NotificationOfflineSoon  :
   never;