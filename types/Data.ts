import { Client as DiscordClient, WebhookClientData } from "discord.js";


/**
 * when this parameter is specified, fennec-utilities will also receive messages from fennec and send events accordingly
 */
export type FennecCompatibility = {
   inGuildId: string;
   inChannelId: string;
};


/**
 * online       : everything up and running
 * offline soon : will go offline soon
 * maintenance  : "offline", fennec will take over
 */
export type Status = "online" | "offline soon" | "maintenance";


export type UpdateType = "ready" | "update";


export type ClientData = {
   discordClient: DiscordClient;
   fennecCompatibility?: FennecCompatibility;
   fennecId: string;
   name: string;
   status: Status;
   webhook: WebhookClientData
};


export type UpdatePayload = {
   id:            string;
   name:          ClientData[`name`];
   startedAt:     number;
   guilds:        number;
   cpuPercentage: number;
   memory:        [ string, string ];
};


export type ErrorPayload = {
   name: string;
   message: string;
   stack: string;
   timestamp: number;
};