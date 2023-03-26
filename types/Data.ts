import { ColorResolvable, WebhookClientData, Snowflake } from "discord.js";


/**
 * online       : everything up and running
 * offline soon : will go offline soon
 * maintenance  : "offline", fennec will take over
 */
export type Status = "online" | "offline soon" | "maintenance";


export type Type = "update" | "error";


export type ClientData = {
   avatarURL: string;
   colour: ColorResolvable;
   name: string;
   threadId: Snowflake;
   webhook: WebhookClientData;
};