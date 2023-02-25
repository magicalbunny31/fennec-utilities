import { Client as DiscordClient, WebhookClientData } from "discord.js";


/**
 * online       : everything up and running
 * offline soon : will go offline soon
 * maintenance  : "offline", fennec will take over
 */
export type Status = "online" | "offline soon" | "maintenance";


export type Type = "ready" | "update";


export type ClientData = {
   discordClient: DiscordClient;
   name: string;
   status: Status;
   startedAt: number;
   webhook: WebhookClientData
};


export type Payload = {
   type:      Type;
   id:        string;
   name:      ClientData[`name`];
   status:    ClientData[`status`];
   startedAt: ClientData[`startedAt`];

   guilds:        number;
   cpuPercentage: number;
   memory:        [ string, string ];

   timestamp: number
};