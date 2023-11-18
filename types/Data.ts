import { ColorResolvable, Snowflake } from "discord.js";
import { Timestamp } from "@google-cloud/firestore";


/**
 * online       : everything up and running
 * offline soon : will go offline soon
 * maintenance  : "offline", fennec will take over
 */
export type StatusName = "online" | "offline-soon" | "maintenance";

export type Status = {
   message:   string;
   name:      StatusName;
   timestamp: Timestamp;
};


export type InteractionType = `autocomplete` | `button` | `chat-input` | `message-context-menu` | `modal-submit` | `select-menu` | `user-context-menu` | `unknown`;

export type InteractionData = {
   id:   Snowflake;
   type: InteractionType;
   name: string;
};


export type FennecFirestore = {
   clientEmail:  string;
   documentName: string;
   privateKey:   string;
   projectId:    string;
};

export type PostSettings = {
   displayedAvatar: string;
   displayedName:   string;
   embedColour:     ColorResolvable;
   threadId:        Snowflake;
};

export type ClientData = {
   firestore:    FennecFirestore;
   postSettings: PostSettings;
   supportGuild: string;
};