import { ClientData, FennecFirestore, InteractionData, Status } from "./Data";


export class Client {
   constructor(ClientData: ClientData);

   private async sendMessage(payload: Object): Promise<void>; // send a message to the webhook, for fennec to respond to

   public avatarURL:     string;
   public colour:        import("discord.js").ColorResolvable;
   public formattedName: string;
   public id:            import("discord.js").Snowflake;
   public threadId:      import("discord.js").Snowflake;
   public webhook:       import("discord.js").WebhookClientData;

   /**
    * send an error
    * @param error error data
    * @param timestamp timestamp of when this error happened, in seconds
    * @param interactionOrSource the interaction if this was an interaction, or the source for this error
    */
   public async sendError(error: Error, timestamp: number, interactionOrSource: import("discord.js").Interaction | string): Promise<void>;

   /**
    * responds to an interaction, showing an error to the user
    * @param interaction the interaction to respond to
    */
   public async respondToInteractionWithError(interaction: import("discord.js").Interaction): Promise<void>;

   /**
    * update this bot's status
    * @param status this bot's status
    */
   public async updateStatus(status: Status): Promise<void>;

   /**
    * update this bot's usage
    * @param {number} guildCount this bot's guild count
    */
   public async updateUsage(guildCount: number): Promise<void>;
};


/**
 * fennec-utilities developer commands 💻
 * @param message [discord.js](https://discord.js.org)' message object, found when a [`Message`](https://discord.js.org/#/docs/discord.js/main/class/Message) event is fired from the [`Client`](https://discord.js.org/#/docs/discord.js/main/class/Client) 💬
 * @param fennec this fennec client 🦊
 * @param fennecFirestore credentials for fennec's [`@google-cloud/firestore`](https://cloud.google.com/firestore) 📦
 * @returns stuff happens, the function runs. what else do we need to return? 📰
 */
export async function developerCommands(message: import("discord.js").Message, fennec: Client, fennecFirestore: FennecFirestore): Promise<void>;