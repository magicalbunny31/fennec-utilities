import { ColorResolvable, Snowflake, WebhookClientData } from "discord.js";


/**
 * online       : everything up and running
 * offline soon : will go offline soon
 * maintenance  : "offline", fennec will take over
 */
export type Status = "online" | "offline soon" | "maintenance";


export type Type = "update" | "error";


export type InteractionType = `autocomplete` | `button` | `chat-input` | `message-context-menu` | `modal-submit` | `select-menu` | `user-context-menu` | `unknown`;


export type InteractionData = {
   id: Snowflake;
   type: InteractionType;
   name: string;
};


export type ClientData = {
   avatarURL: string;
   colour: ColorResolvable;
   formattedName: string;
   id: string;
   threadId: Snowflake;
   webhook: WebhookClientData;
};