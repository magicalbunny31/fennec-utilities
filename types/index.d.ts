import { ClientData, FennecFirestore, InteractionData, Status } from "./Data";
import { NotificationReturnType, NotificationType } from "./Notification";


export class Client {
   /**
    * fennec-utilities 🦊
    * @param options options for this client 🎛️
    */
   constructor(options: ClientData);

   private webhook:   import("discord.js").WebhookClientData;
   private firestore: FennecFirestore;

   private async sendMessage(payload: Object): Promise<void>; // send a message to the webhook, for fennec to respond to

   public avatarURL:     string;
   public colour:        import("discord.js").ColorResolvable;
   public formattedName: string;
   public id:            import("discord.js").Snowflake;
   public threadId:      import("discord.js").Snowflake;

   /**
    * send an error ❗
    * @param error error data 📣
    * @param timestamp timestamp of when this error happened, in seconds ⌚
    * @param interactionOrSource the interaction if this was an interaction, or the source for this error 📋
    */
   public async sendError(error: Error, timestamp: number, interactionOrSource: import("discord.js").Interaction | string): Promise<void>;

   /**
    * responds to an interaction, showing an error to the user 🗯️
    * @param interaction the interaction to respond to 💬
    */
   public async respondToInteractionWithError(interaction: import("discord.js").Interaction): Promise<void>;

   /**
    * get this bot's currently set status 📛
    */
   public async getStatus(): Promise<Status>;

   /**
    * update this bot's status 💭
    * @param status this bot's status 🏷️
    * @param reason why this bot's status is changing ❓
    */
   public async updateStatus(status: Status, reason?: string): Promise<void>;

   /**
    * update this bot's usage 🤖
    * @param {number} guildCount this bot's guild count 📂
    */
   public async updateUsage(guildCount: number): Promise<void>;

   /**
    * update this bot's usage every 10 or so minutes ⏱️
    * @param discord discord client for this bot 🗃️
    */
   public updater(discord: import("discord.js").Client): Promise<void>;

   /**
    * get the global blacklist 📃
    */
   public async getGlobalBlacklist(): Promise<import("discord.js").Snowflake[]>

   /**
    * get the current notification for this application 📰
    * @param type type of notification to get 📣
    */
   public async getNotification<T extends NotificationType>(type: Omit<NotificationType, "blacklist">): Promise<NotificationReturnType<T>>?;

   /**
    * notify a user of a notification 📰
    * @param interaction the interaction to respond to 💬
    * @param type type of notification 📣
    */
   public async notify(interaction: import("discord.js").Interaction, type: NotificationType): Promise<void>;

   /**
    * check if a user has seen this notification 📋
    * @param user this user to check 👤
    * @param type type of notification to check if this user has seen 📣
    */
   public async hasSeenNotification(user: import("discord.js").User, type: Omit<NotificationType, "announcement" | "blacklist" | "maintenance">): Promise<boolean>;

   /**
    * set that a user has seen a notification 📋
    * @param user this user to set 👤
    * @param type type of notification to set that this user has seen 📣
    */
   public async setSeenNotification(user: import("discord.js").User, type: Omit<NotificationType, "announcement" | "blacklist" | "maintenance">): Promise<void>;
};


/**
 * fennec-utilities developer commands 💻
 * @param message [discord.js](https://discord.js.org)' message object, found when a [`Message`](https://discord.js.org/#/docs/discord.js/main/class/Message) event is fired from the [`Client`](https://discord.js.org/#/docs/discord.js/main/class/Client) 💬
 * @param fennec this fennec client 🦊
 * @param developers array of users which can use these commands 🤖
 * @param fennecFirestore credentials for fennec's [`@google-cloud/firestore`](https://cloud.google.com/firestore) 📦
 * @returns stuff happens, the function runs....what else do we need to return? 📰
 */
export async function developerCommands(message: import("discord.js").Message, fennec: Client, developers: import("discord.js").Snowflake[], fennecFirestore: FennecFirestore): Promise<void>;