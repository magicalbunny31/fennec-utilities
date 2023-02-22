import { ClientData, Payload } from "./Data"


export class Client {
   private start: boolean;
   private token: boolean;

   constructor(ClientData: ClientData);

   set setStatus(status: string): string;

   private async getGuilds():  Promise<number>;
   private getCpuPercentage(): number;
   private getMemory():        [ string, string ];

   private async send(payload: Object):                Promise<void>;
   private async getPayload(type: "ready" | "update"): Payload;
   private async sendUpdate():                         Promise<void>;

   /**
    * start the client
    */
   public async start(): Promise<void>;

   /**
    * send an error
    */
   public async sendError(error: Error, timestamp: number): Promise<void>;

   /**
    * stops the client
    */
   public stop(): void;
};