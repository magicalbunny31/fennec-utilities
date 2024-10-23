import { Announcement } from "./Announcement";
import { ApplicationStatisticsStatus } from "./ApplicationStatus";
import { BlacklistCache, BlacklistEntry } from "./Blacklist";

import { EventEmitter } from "node:events";
import { emojis } from "@magicalbunny31/pawesome-utility-stuffs";
import { Interaction, Message } from "discord.js";
import WebSocket from "ws";


type FennecClientInit = {
   /**
    * 🌐 base url for requests
    */
   baseUrl: string;

   /**
    * 🔑 api key for requests
    */
   authorisation: string;
};


export class FennecClient {


   private fennecWorker: FennecClientInit;


   private fennecCloudRun: FennecClientInit;


   private initialised: boolean;


   private notInitialisedError: Error;


   private noFennecCloudRunArgs: Error;


   private blacklistCache: BlacklistCache;


   private ws: typeof WebSocket;


   cloudRun: typeof EventEmitter;


   /**
    * 💻 `fennec-utilities`
    * @param fennecWorker ☁️ options for `fennec-worker`
    * @param fennecCloudRun ☁️ options for `fennec-cloud-run`
    */
   constructor(fennecWorker: FennecClientInit, fennecCloudRun?: FennecClientInit);


   private async sendRequest(method: string, route: string, body: unknown): Promise<unknown>;


   private async updateBlacklistCache(): Promise<void>;


   private async updateAnnouncementCache(): Promise<void>;


   private async updateAnnouncementUsersCache(): Promise<void>;


   private async updateOnlineStatus(): Promise<void>;


   private initialiseWebsocket(): void;


   /**
    * 🏳️ initialise the `FennecClient`: must be run once before running other methods
    */
   async initialise(): Promise<void>;


   /**
    * 🏓 check if another `FennecClient` is listening to `fennec-cloud-run`
    *
    * 📣 if `undefined` was returned, it may have interfered with a request between other `FennecClient`s and should not be trusted
    * @param id 🏷️ target `FennecClient` id (type) to check if is listening to `fennec-cloud-run`
    */
   isConnected(id: string): Promise<boolean?>;


   /**
    * 📤 send data to another `FennecClient` listening to `fennec-cloud-run`
    *
    * 🏓 before running this method, the target `FennecClient` should be checked if it is listening to `fennec-cloud-run` with `FennecClient.isConnected()`
    * @param toId 🏷️ target `FennecClient` id (type) to send data to
    * @param data 📦 data to send to this `FennecClient`
    */
   sendData(toId: string, data: any): void;


   /**
    * 📃 get the list of user ids on the blacklist
    *
    * ⌚ since this checks the `.#blacklistCache`, it may be outdated by 15 minutes
    */
   listBlacklist(): string[];


   /**
    * 📃 check if a `userId` is on the blacklist
    *
    * ⌚ since this checks the `.#blacklistCache`, it may be outdated by 15 minutes - use `.getUserBlacklistInfo()` to query the database for a more up-to-date update
    * @param userId 👤 the user id to check against the blacklist
    * @returns 🏷️ whether this `userId` is on the blacklist or not
    */
   isOnBlacklist(userId: string): boolean;


   /**
    * 📃 get blacklist information about this `userId`
    *
    * 📣 this should **NOT** be used to check if a `userId` is on the blacklist due to how costly this operation can be - use `.isBlacklisted()` instead
    *
    * ⌚ this will query the database, ensuring that data is up-to-date
    * @param userId 👤 the user id to check against the blacklist
    * @returns 🏷️ information about this `userId`'s blacklist entry
    */
   async getUserBlacklistInfo(userId: string): Promise<BlacklistEntry>;


   /**
    * ➕ add this `userId` to the blacklist
    * 
    * 🔑 only `discord-fennec-bot`'s api key can use this endpoint, trying to use any other api key will result in a thrown `Error`
    * @param userId 👤 the user id to add to the blacklist
    * @param byUserId 👥 the user id who added this `userId` to the blacklist
    * @param at 🗓️ date of when this `userId` was added to the blacklist
    * @param reason 📃 reason why this `userId` was added to the blacklist: cannot be a multi-line string and must be <= 1024 characters in length
    * @param expiresAt ⌚ date of when this `userId` will be removed from the blacklist
    */
   async addToBlacklist(userId: string, byUserId: string, at: Date, reason: string, expiresAt?: Date): Promise<void>;


   /**
    * ➖ remove this `userId` from the blacklist
    * 
    * 🔑 only `discord-fennec-bot`'s api key can use this endpoint, trying to use any other api key will result in a thrown `Error`
    * @param userId 👤 the user id to remove from the blacklist
    */
   async removeFromBlacklist(userId: string): Promise<void>;


   /**
    * 📁 get this app's guild invite
    *
    * ❓ this will return `undefined` if this app doesn't have a guild invite set
    * @returns 🔗 discord guild invite link
    */
   async getGuildInvite(): Promise<string?>;


   /**
    * 📰 post a log embed to the app's application-status thread
    * @param content 📄 contents of the log: can be a multi-line string and has no character limit
    * @param at 🗓️ date of when this log was generated
    */
   async postLog(content: string, at: Date): Promise<void>;


   /**
    * 📰 post an error log embed to the app's application-status thread
    * @param error 📋 the error that occurred
    * @param source 🏷️ where this error occurred - this string should be formatted as neither `fennec-utilities` nor `fennec-worker` will format this as inlineCode for you (do it yourself lol)
    * @param at 🗓️ date of when this error occurred
    * @param interactionId 💬 the id of the interaction of which this error originated from
    */
   async postErrorLog(error: Error, source: string, at: Date, interactionId?: string): Promise<void>;


   /**
    * 📋 get this application's application statistics status from their application status
    *
    * ❓ fields will be omitted if its `application-statistics` field is unknown
    *
    * ❓ the return value will be `undefined` if this app doesn't have an `application-status`
    * @returns 📄 the `application-status`' `application-statistics`' `name` field
    */
   async getApplicationStatusApplicationStatisticsStatus(): Promise<ApplicationStatisticsStatus?>;


   getAnnouncement(): Announcement;


   /**
    * 📃 set if a `userId` has seen this application's announcement
    * 
    * ⌚ this queries the database: if there is no set announcement, calling this method won't do anything
    * @param userId 👤 the user id to set if they've seen this application's announcement
    */
   async setSeenAnnouncement(userId: string): Promise<void>;


   /**
    * 📃 check if a `userId` has seen this application's announcement
    *
    * ⌚ since this checks the `.#announcementCache`, it may be outdated by 15 minutes
    * @param userId 👤 the user id to check if they've seen this application's announcement
    * @returns 🏷️ whether this `userId` has seen this application's announcement
    */
   hasSeenAnnouncement(userId: string): boolean;


};


/**
 * 🏷️ valid fields for `ApplicationStatisticsStatusName`
 */
export const ApplicationStatisticsStatusName: typeof import("../src/data/ApplicationStatisticsStatusName.js");


/**
 * 🏷️ valid fields for `NotificationType`
 */
export const NotificationType: typeof import("../src/data/NotificationType.js");


/**
 * 📃 links to the privacy policy
 */
export const PrivacyPolicy: typeof import("../src/data/PrivacyPolicy.js");


/**
 * 📙 link to the terms of service
 */
export const TermsOfService: typeof import("../src/data/TermsOfService.js");



/**
 * 💻 developer commands by `fennec-utilities`
 * @param message 💬 the [discord.js](https://discord.js.org)' [`Message`](https://discord.js.org/docs/packages/discord.js/main/Message:Class) object
 * @param developers 🤖 the user ids which can invoke these commands
 * @param allEmojis 🦊 guild and application emojis, from [`@magicalbunny31/pawesome-utility-stuffs`](https://github.com/magicalbunny31/pawesome-utility-stuffs)
 */
export async function developerCommands(message: Message, developers: string[], allEmojis: ReturnType<typeof emojis>): Promise<void>;


/**
 * 💬 notify the person about a specific `notificationType`
 * 
 * 📣 when the `notificationType` is `NotificationType.Announcement`: this will check if the person has seen this announcement and, if not, show them the announcement and set them as having seen the announcement
 * @param interaction 💬 the [discord.js](https://discord.js.org)' `Interaction` object
 * @param fennec 💻 this app's `FennecClient`
 * @param notificationType 🏷️ the `NotificationType` to show
 * @param emojis 🦊 guild and application emojis, from [`@magicalbunny31/pawesome-utility-stuffs`](https://github.com/magicalbunny31/pawesome-utility-stuffs)
 */
export async function notify(interaction: Interaction, fennec: FennecClient, notificationType: typeof NotificationType, emojis: ReturnType<typeof emojis>): Promise<void>;