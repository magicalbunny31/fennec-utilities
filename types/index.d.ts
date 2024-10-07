import { ClientData, FennecFirestore, InteractionData, PostSettings, Status, StatusName } from "./Data";
import { NotificationReturnType, NotificationType } from "./Notification";
import { Firestore } from "@google-cloud/firestore";


export class Client {
   /**
    * fennec-utilities 🦊
    * @param options options for this client 🎛️
    */
   constructor(options: ClientData);

   public firestore: {
      documentName: string;
      firestore:    Firestore;
   };
   public postSettings: PostSettings
   public supportGuild: string;

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
    * @param error error to show to the user 📋
    */
   public async respondToInteractionWithError(interaction: import("discord.js").Interaction, error?: Error): Promise<void>;

   /**
    * get the global blacklist 📃
    */
   public async getGlobalBlacklist(): Promise<import("discord.js").Snowflake[]>
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