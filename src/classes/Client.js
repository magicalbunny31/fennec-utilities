import { codeBlock, WebhookClient } from "discord.js";
import { REST } from "discord.js";
import os from "os";
import { number } from "@magicalbunny31/awesome-utility-stuff";


module.exports = class Client {
   // sets the loop
   #start;

   // token for discord rest client
   #token;


   /**
    * @param {import("@types/Data").ClientData}
    */
   constructor({ discordClient, name, status, startedAt, webhook }) {
      // construct!!
      this.id = discordClient.application.id;
      this.name = name;
      this.avatarURL = discordClient.user.avatarURL({
         extension: `png`,
         size: 4096
      });
      this.status = status;
      this.startedAt = startedAt;
      this.webhook = new WebhookClient(webhook);

      this.#token = discordClient.token;
   };


   /**
    * @param {string} status
    */
   set setStatus(status) {
      // setter
      this.status = status;
   };


   async #getGuilds() {
      const rest = new REST({ version: `10` })
         .setToken(this.#token);

      const guilds = await rest.get(`/users/@me/guilds`);
      return guilds.length;
   };


   #getCpuPercentage() {
      const [ cpu ] = os.cpus();

      const total = Object
         .values(cpu.times)
         .reduce((accumulator, timeValue) => accumulator + timeValue, 0);

      const usage = process.cpuUsage();
      const currentCpuUsage = (usage.user + usage.system) * 1000;

      const cpuPercentage = currentCpuUsage / total * 100;
      return cpuPercentage;
   };


   #getMemory() {
      const toHuman = bytes => {
         if (Math.abs(bytes) < 1000)
            return `${bytes} B`;

         const units = [ `kB`, `MB`, `GB` ];

         let unit = -1;
         const remainder = 10 ** dp;

         do {
            bytes /= 1000;
            unit ++;

         } while (
            Math.round(Math.abs(bytes) * remainder) / remainder >= thresh
            && unit < units.length - 1
         );

         return `${bytes.toFixed(1)} ${units[unit]}`;
      };

      const { heapUsed, heapTotal } = process.memoryUsage();

      return [ toHuman(heapUsed), toHuman(heapTotal) ];
   };


   /**
    * @param {Object} payload
    */
   async #send(payload) {
      // sends a webhook
      void await this.webhook.send({
         username: this.name,
         avatarURL: this.avatarURL,

         content: codeBlock(
            JSON.stringify(payload)
         )
      });
   };


   /**
    * @param {"ready" | "update"} type
    */
   async #getPayload(type) {
      // formats and returns payload
      return {
         type,
         id:        this.id,
         name:      this.name,
         status:    this.status,
         startedAt: this.startedAt,

         guilds:        await this.#getGuilds(),
         cpuPercentage:       this.#getCpuPercentage(),
         memory:              this.#getMemory(),

         timestamp: Date.now()
      };
   };


   async #sendUpdate() {
      const payload = await this.#getPayload(`update`);
      void await this.#send(payload);
   };


   /**
    * start the client
    */
   async start() {
      // client already started
      if (this.#start)
         throw new Error(`@magicalbunny31/fennec-utilities › Client: client already started 🚫`);

      // send the payload
      const payload = await this.#getPayload(`ready`);
      await this.#send(payload);

      // start the client
      this.#start = true;

      // loop updates
      const repeat = async () => {
         // stop looping
         if (!this.#start)
            return;

         // send an update
         await this.#sendUpdate();

         // set the next loop
         void setTimeout(repeat, number(240000, 360000));
      };

      void setTimeout(repeat, number(240000, 360000));
   };


   /**
    * send an error
    * @param {Error} error
    * @param {number} timestamp
    */
   async sendError(error, timestamp) {
      const payload = {
         type: `error`,
         error: {
            name: error.name,
            message: error.message,
            stack: error.stack
         },
         timestamp
      };

      void await this.#send(payload);
   };


   /**
    * stops the client
    */
   stop() {
      this.#start = false;
   };
};