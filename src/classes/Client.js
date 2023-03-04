const EventEmitter = require("events");
const Discord = require("discord.js");
const os = require("os");
const { number, strip } = require("@magicalbunny31/awesome-utility-stuff");


module.exports = class Client extends EventEmitter {
   /**
    * @param {import("@types/Data").ClientData} options
    */
   constructor(options) {
      // EventEmitter
      super({ captureRejections: true });

      // discord
      this.discordClient = options.discordClient;
      this.webhook = new Discord.WebhookClient(options.webhook);

      // basic info
      this.id = this.discordClient.application.id;
      this.name = options.name;
      this.formattedName = options.formattedName;
      this.colour = options.colour;
      this.avatarURL = this.discordClient.user.avatarURL({
         extension: `png`,
         size: 4096
      });

      // other
      this.startedAt = Date.now() - this.discordClient.uptime;
      this.fennecCompatibility = options.fennecCompatibility;
      this.fennecId = options.fennecId;
   };


   async #getGuilds() {
      const rest = new Discord.REST()
         .setToken(this.discordClient.token);

      try {
         const guilds = await rest.get(`/users/@me/guilds`);
         return guilds.length;

      } catch {
         return null;
      };
   };


   #getCpuPercentage() {
      const [ cpu ] = os.cpus();

      const total = Object
         .values(cpu.times)
         .reduce((accumulator, timeValue) => accumulator + timeValue, 0);

      const usage = process.cpuUsage();
      const currentCpuUsage = (usage.user + usage.system) / 1000;

      const cpuPercentage = currentCpuUsage / total * 100;
      return Math.round(cpuPercentage * 100) / 100;
   };


   #getMemory() {
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

      return [ toHuman(heapUsed), toHuman(heapTotal) ];
   };


   async #send(payload) {
      return await this.webhook.send({
         username: this.name.includes(`discord`) // username cannot contain "discord"
            ? this.name.split(`-`).slice(1).join(`-`)
            : this.name,
         avatarURL: this.avatarURL,

         content: payload
      });
   };


   #getMessageContent(type, payload) {
      return strip`
         ${Discord.userMention(this.fennecId)} ${Discord.bold(type)} ${
            Discord.codeBlock(`js`,
               JSON.stringify(payload)
            )
         }
      `;
   };


   async #getUpdate() {
      return {
         id: this.discordClient.application.id,
         colour: this.colour,
         name: this.name,
         formattedName: this.formattedName,
         startedAt: this.startedAt,
         guilds: await this.#getGuilds(),
         cpuPercentage: this.#getCpuPercentage(),
         memory: this.#getMemory()
      };
   };


   #getError(error, timestamp) {
      return {
         name: error.name,
         message: error.message,
         stack: error.stack,
         timestamp
      };
   };


   #getMatchBetweenPattern(start, end) {
      return new RegExp(`(?<=${Discord.escapeMarkdown(start)})([^*]*)(?=${Discord.escapeMarkdown(end)})`);
   };


   #parseResponse(content) {
      return JSON.parse(
         content
            .match(this.#getMatchBetweenPattern(`\`\`\`js`, `\`\`\``))
            [0]
            .trim()
      );
   };


   async #awaitMessage(messageId) {
      // some stuffs to fetch
      const guild   = await this.discordClient.guilds.fetch(this.fennecCompatibility.inGuildId);
      const channel = await guild.channels           .fetch(this.fennecCompatibility.inChannelId);

      // wait for a message which replies to this messageId
      const messages = await channel.awaitMessages({
         filter: m => m.reference?.messageId === messageId,
         max: 1,
         time: 60000
      });

      const message = messages.first();

      // no message,,
      if (!message)
         return;

      // the response
      const response = this.#parseResponse(message.content);

      // emit a status change if it has changed
      if (response.status !== this.status)
         this.setStatus(response.status);

      // return the response
      return response;
   };


   async #repeat(initialTimeout = number(240000, 360000)) {
      // loop updates
      const repeat = async () => {
         // stop looping
         if (!this.started)
            return;

         // send the payload
         const payload = await this.#getUpdate();
         const content = this.#getMessageContent(`update`, payload);
         const { id: messageId } = await this.#send(content);

         // await a response
         const response = this.#awaitMessage(messageId);

         // set the next loop
         void setTimeout(repeat, response?.nextUpdate || number(240000, 360000));
      };

      void setTimeout(repeat, initialTimeout);
   };


   #watchStatusChange() {
      this.discordClient.once(Discord.Events.MessageCreate, async message => {
         // client has stopped
         if (this.started)
            return;

         // message not from the fennecCompatibility variables
         if (message.channel.id !== this.fennecCompatibility.inChannelId)
            return this.#watchStatusChange();

         // message doesn't mention this application
         const mentionsUser = message.content.match(this.#getMatchBetweenPattern(`<@`, `>`))?.[0] === this.discordClient.application.id;
         if (!mentionsUser)
            return this.#watchStatusChange();

         // message is a reply to another message
         if (message.reference?.messageId)
            return this.#watchStatusChange();

         // the response
         const response = this.#parseResponse(message.content);

         // status is already set to this
         if (response.status === this.status)
            return this.#watchStatusChange();

         // emit the status change and keep listening
         this.setStatus(response.status);
         return this.#watchStatusChange();
      });
   };


   /**
    * start the client
    */
   async start() {
      // fennec compatibility needed
      if (!this.fennecCompatibility)
         throw new Error(`@magicalbunny31/fennec-utilities › Client: fennecCompatibility needed to start the client 🚫`);

      // client already started
      if (this.started)
         throw new Error(`@magicalbunny31/fennec-utilities › Client: client already started 🚫`);

      // start the client
      this.started = true;

      // send the payload
      const payload = await this.#getUpdate();
      const content = this.#getMessageContent(`ready`, payload);
      const { id: messageId } = await this.#send(content);

      // await a response
      const response = await this.#awaitMessage(messageId);

      // send updates
      this.#repeat(response?.nextUpdate);
   };


   /**
    * change the status of the Client, will fire a `status` event
    * @param {import("@types/Data").Status} status
    */
   setStatus(status) {
      // setter
      this.status = status;

      // emit an event
      void this.emit(`status`, status);
   };


   /**
    * send an error
    * @param {Error} error
    * @param {number} timestamp
    */
   async sendError(error, timestamp) {
      // send the payload
      const payload = this.#getError(error, timestamp);
      const content = this.#getMessageContent(`error`, payload);
      void await this.#send(content);
   };


   /**
    * stops the client
    */
   stop() {
      this.started = false;
   };
};