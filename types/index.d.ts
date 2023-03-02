import EventEmitter from "events";
import { ClientData, ErrorPayload, Status, UpdatePayload, UpdateType } from "./Data"
import { APIMessage, Message } from "discord.js";


export declare interface Client {
   on(event: `status`, listener: (status: string) => void): this;
};


export class Client extends EventEmitter {
   constructor(ClientData: ClientData);

   private async getGuilds():  Promise<number>?;   // get the number of guilds this discordClient is in
   private getCpuPercentage(): number;             // % of cpu this process is using
   private getMemory():        [ string, string ]; // used memory / total allocated memory

   private async send(payload: Object):                          Promise<APIMessage>;    // send a webhook message to the fennec messages channel
   private getMessageContent(type: UpdateType, payload: string): string;                 // formatted message content for discord
   private async getUpdate():                                    Promise<UpdatePayload>; // get the update payload, identical for ready and update events
   private getError(error: Error, timestamp: number):            ErrorPayload;           // get the error payload

   private getMatchBetweenPattern(start: string, end: string): RegExp; // get a regular expression that matches content between the start and end parameters
   private parseResponse(content: string):                     string; // parses a string to match the content within a discord codeBlock, then parsing it into an Object

   private async awaitMessage(messageId: string):              Promise<Object>; // awaits for a message replying to the messageId, then parses its response with this#parseResponse()
   private repeat(initialTimeout: number):                     void;            // sets up a repeating function that will periodically send updates to the fennec messages channel
   private watchStatusChange():                                void;            // watches for status changes

   /** starts the client */
   public async start(): void;

   /** change the status of the Client, will fire a `status` event */
   public setStatus(status: Status): void;

   /** send an error */
   public async sendError(error: Error, timestamp: number): Promise<void>;

   /** stops the client */
   public stop(): void;
};