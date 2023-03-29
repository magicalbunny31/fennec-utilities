import { ClientData, InteractionData, Status } from "./Data";


export class Client {
   constructor(ClientData: ClientData);

   private async sendMessage(payload: Object): Promise<void>; // send a message to the webhook, for fennec to respond to

   /**
    * send an error
    * @param error error data
    * @param timestamp timestamp of when this error happened, in seconds
    * @param interactionOrSource the interaction if this was an interaction, or the source for this error
    */
   public async sendError(error: Error, timestamp: Date | number, interactionOrSource: import("discord.js").Interaction | string): Promise<void>;

   /**
    * responds to an interaction, showing an error to the user
    * @param interaction the interaction to respond to
    */
   public async respondToInteractionWithError(interaction: import("discord.js").Interaction): Promise<void>;

   /**
    * update this bot's guild count
    * @param guildCount this bot's guild count
    */
   public async updateGuildCount(guildCount: number): Promise<void>;

   /**
    * update this bot's status
    * @param status this bot's status
    */
   public async updateStatus(status: Status): Promise<void>;

   /**
    * update this bot's usage
    */
   public async updateUsage(): Promise<void>;
};