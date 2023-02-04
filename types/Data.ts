import { Client as DiscordClient, WebhookClientData } from "discord.js";


export type ClientData = {
   discordClient: DiscordClient;
   name: string;
   status: "online" | "development" | "maintenance";
   startedAt: number;
   webhook: WebhookClientData
};


export type Payload = {
   type:      "ready" | "update";
   id:        string;
   name:      ClientData[`name`];
   status:    ClientData[`status`];
   startedAt: ClientData[`startedAt`];

   guilds:        number;
   cpuPercentage: number;
   memory:        [ string, string ];

   timestamp: number
};