import { Status } from "./Data";
import { Timestamp } from "@google-cloud/firestore";

interface Notification {
   "content":    string;
   "created-at": Timestamp;
   "expires-at": Timestamp;
};

type NotificationAlert        =      Notification;
type NotificationAnnouncement = Omit<Notification, "expires-at">;
type NotificationMaintenance  = Status;
type NotificationOfflineSoon  = Status;

export type NotificationType = "alert" | "announcement" | "maintenance" | "offline-soon";

export type NotificationReturnType<T> =
   T extends "alert"        ? NotificationAlert        :
   T extends "announcement" ? NotificationAnnouncement :
   T extends "maintenance"  ? NotificationMaintenance  :
   T extends "offline-soon" ? NotificationOfflineSoon  :
   never;