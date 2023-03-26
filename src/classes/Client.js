const Discord = require("discord.js");
const os = require("os");


module.exports = class Client {


   /**
    * fennec-utilities
    * @param {import("@types/Data").ClientData} options options for this client
    */
   constructor(options) {
      // discord
      this.webhook = new Discord.WebhookClient(options.webhook);

      // thread's starter message
      this.threadId = options.threadId;
      this.name = options.name;
      this.avatarURL = options.avatarURL;
      this.colour = options.colour;
   };


   async #sendMessage(payload) {
      const json = JSON.stringify({
         ...payload,
         starterMessage: {
            name: this.name,
            avatarURL: this.avatarURL,
            colour: this.colour
         }
      });

      void await this.webhook.send({
         threadId: this.threadId,
         content: Discord.codeBlock(`js`, json)
      });
   };


   /**
    * send an error
    * @param {Error} error error data
    * @param {Date | number} timestamp when this error happened
    * @returns {Promise<void>}
    */
   async sendError(error, timestamp) {
      void await this.#sendMessage({
         type: `error`,
         error: {
            message: error.message,
            stack: error.stack,
            name: error.name
         },
         timestamp
      });
   };


   /**
    * update this bot's guild count
    * @param {number} guildCount this bot's guild count
    */
   async updateGuildCount(guildCount) {
      void await this.#sendMessage({
         type: `update`,
         guildCount
      });
   };


   /**
    * update this bot's status
    * @param {"online" | "offline soon" | "maintenance"} status this bot's status
    */
   async updateStatus(status) {
      void await this.#sendMessage({
         type: `update`,
         status
      });
   };


   /**
    * update this bot's usage
    */
   async updateUsage() {
      const cpu = (() => {
         const [ cpu ] = os.cpus();

         const total = Object
            .values(cpu.times)
            .reduce((accumulator, timeValue) => accumulator + timeValue, 0);

         const usage = process.cpuUsage();
         const currentCpuUsage = (usage.user + usage.system) / 1000;

         const cpuPercentage = currentCpuUsage / total * 100;
         return Math.round(cpuPercentage * 100) / 100;
      })();

      const memory = (() => {
         const toHuman = bytes => {
            if (Math.abs(bytes) < 1000)
               return `${bytes} B`;

            const units = [ `KB`, `MB`, `GB` ];

            let unit = -1;
            const remainder = 10;

            do {
               bytes /= 1000;
               unit ++;

            } while (
               Math.round(Math.abs(bytes) * remainder) / remainder >= 1000
               && unit < units.length - 1
            );

            return `${bytes.toFixed(1)} ${units[unit]}`;
         };

         const { heapUsed, heapTotal } = process.memoryUsage();
         return {
            heapUsed: toHuman(heapUsed),
            heapTotal: toHuman(heapTotal)
         };
      })();

      void await this.#sendMessage({
         type: `update`,
         cpu,
         memory
      });
   };


};