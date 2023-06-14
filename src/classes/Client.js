const Discord = require("discord.js");
const { Firestore } = require("@google-cloud/firestore");
const { colours, emojis, choice, noop, number, strip, wait } = require("@magicalbunny31/awesome-utility-stuff");
const os = require("os");


module.exports = class Client {
   #webhook;
   #firestore;


   /**
    * fennec-utilities 🦊
    * @param {import("@types/Data").ClientData} options options for this client 🎛️
    */
   constructor(options) {
      // discord
      this.#webhook = new Discord.WebhookClient(options.webhook);

      // firestore
      this.#firestore = new Firestore({
         credentials: {
            client_email: options.firestore.clientEmail,
            private_key: options.firestore.privateKey
         },
         projectId: options.firestore.projectId
      });

      // thread's starter message
      this.threadId = options.threadId;
      this.formattedName = options.formattedName;
      this.id = options.id;
      this.avatarURL = options.avatarURL;
      this.colour = options.colour;
   };


   async #sendMessage(payload) {
      const json = JSON.stringify({
         ...payload,
         starterMessage: {
            formattedName: this.formattedName,
            id: this.id,
            avatarURL: this.avatarURL,
            colour: this.colour
         }
      });

      void await this.#webhook.send({
         threadId: this.threadId,
         content: Discord.codeBlock(`js`, json)
      });
   };


   /**
    * send an error ❗
    * @param {Error} error the error that happened 📣
    * @param {number} timestamp timestamp of when this error happened, in seconds ⌚
    * @param {import("discord.js").Interaction | string} interactionOrSource the interaction if this was an interaction, or the source for this error 📋
    * @returns {Promise<void>}
    */
   async sendError(error, timestamp, interactionOrSource) {
      const name = [
         interactionOrSource.commandName,
         interactionOrSource.options?.getSubcommandGroup?.(false),
         interactionOrSource.options?.getSubcommand?.(false)
      ]
         .filter(Boolean)
         .join(` `)
      || interactionOrSource.customId
      || interactionOrSource;

      const type = (() => {
         switch (true) {
            case interactionOrSource.isAnySelectMenu?.():             return `select-menu`;
            case interactionOrSource.isAutocomplete?.():              return `autocomplete`;
            case interactionOrSource.isButton?.():                    return `button`;
            case interactionOrSource.isChatInputCommand?.():          return `chat-input`;
            case interactionOrSource.isMessageContextMenuCommand?.(): return `message`;
            case interactionOrSource.isModalSubmit?.():               return `modal-submit`;
            case interactionOrSource.isUserContextMenuCommand?.():    return `user`;
         };
      })();

      void await this.#sendMessage({
         type: `error`,
         error: {
            message: error.message,
            stack: error.stack,
            name: error.name
         },
         timestamp,
         interaction: type
            ? {
               id: interactionOrSource.id,
               name,
               type
            }
            : `${interactionOrSource}`
      });
   };


   /**
    * responds to an interaction, showing an error to the user 🗯️
    * @param {import("discord.js").Interaction} interaction the interaction to respond to 💬
    */
   async respondToInteractionWithError(interaction) {
      const type = (() => {
         switch (true) {
            case interaction.isAnySelectMenu?.():             return `select menu`;
            case interaction.isButton?.():                    return `button`;
            case interaction.isChatInputCommand?.():          return `slash command`;
            case interaction.isMessageContextMenuCommand?.(): return `context menu command`;
            case interaction.isModalSubmit?.():               return `modal`;
            case interaction.isUserContextMenuCommand?.():    return `context menu command`;
            default:                                                  return `interaction`;
         };
      })();

      const response = choice([
         `${emojis.blushy} ahhhhh! what just happened?!`,
         `${emojis.spiky_speech_bubble} that wasn't supposed to happen..`,
         `${emojis.sweats} well, this is awkward..`,
         `${emojis.hug} don't worry! this thing'll be fixed soon~`,
         `${emojis.boooo} boooo!`,
         `${emojis.stop} stop right there, criminal scum!`,
         `${emojis.music_notes} what the hell am i doin' here? i don't belong here..~`,
         `${emojis.national_park} how about going out for some air while you wait for this to be fixed?`,
         `${emojis.aie} take that! -and this!`,
         `${emojis.pbjt} ..ahh, that's apples mate.`,
         `${emojis.shhh} shhh! this is top secret stuffs!!`,
         `${emojis.ow} this is like watching a train wreck in slow motion, man`,
         `${emojis.dab} \\*BAM\\*`,
         `${emojis.yoshifall} not good!`,
         `${emojis.scree} \\*confused sergal screaming noises\\*`,
         `${emojis.slurp} \\*slurp\\*`,
         `${emojis.nom} nom, nom, eat this.. nom, nom.`,
         `${emojis.woah} got damn!`,
         `${emojis.pawbs} look at all these beans`,
         `${emojis.ooh} i think this code here is, well, drunken`,
         `${emojis[`BWAH`]} BLOODY HELL!`,
         `${emojis.onoes} oh noes! another error!`,
         `${emojis.wrench} so this is what happens when you entrust a furry with development, huh`,
         `${emojis.airplane[1]} destination: unknown`,
         `${emojis.loading} ||y||||o||||u|||| ||||h||||a||||v||||e|||| ||||b||||e||||e||||n|||| ||||e||||n||||t||||e||||r||||t||||a||||i||||n||||e||||d||||!||`,
         `${emojis[`EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE`]} ooh boy, another bug to squash!`,
         `${emojis.happ}${emojis.happ}${emojis.happ}`,
         `${emojis[`FOX`]} here's a fox for moral support~`,
         `${emojis.hwat} no amount of washi tape can fix this!`,
         `${emojis.facepaw} sorry we've left you astray!`,
         `${emojis.muh} either the dumb furry dev got something wrong or you broke this (accidentally?)`,
         `${emojis.pfff} we, too, really have no idea as to what has happened..`,
         `${emojis.oi} EY! ERROR!`,
         `${emojis.yeet} ..i can't think of a witty comment including the word "yeet" \\*~ dev furry\\*`,
         `${emojis.yaya} welcome! you've just discovered our secret party!`,
         `${emojis.bap} this ain't it, stop!`,
         `${emojis.cutie} there's gotta be some room for cute furry boys....right?`,
         `${emojis.bah} well, you don't see \\*that\\* every day!`,
         `${emojis.claps} aye aye, well done chef`,
         `${emojis.furdancing} out partying~`,
         `${emojis.mhn} i can fix it!`,
         `${emojis.pout} awh, well damn!`,
         `${emojis.shrug} muh`
      ]);

      const embeds = [
         new Discord.EmbedBuilder()
            .setColor(colours.red)
            .setDescription(strip`
               ${emojis.rip} **an error occurred with this ${type}..**
               > ${response}
            `)
            .setFooter({
               text: `🆔 ${interaction.id}`
            })
      ];

      try {
         // attempt to defer the reply ephemerally, if not then assume the interaction has been replied to already
         await interaction.deferReply({
            ephemeral: true
         });

      } catch {
         noop;

      } finally {
         // this *could* have a chance of throwing an error (user deleting message, guild deleted..)
         try {
            await interaction.editReply({
               content: null,
               embeds,
               components: [],
               files: []
            });

         } catch {
            noop;
         };
      };

      return;
   };


   /**
    * get this bot's currently set status 📛
    */
   async getStatus() {
      const { name: status } = (await this.#firestore.collection(`stats`).doc(this.id).get()).data().status;
      return status;
   };


   /**
    * update this bot's status 💭
    * @param {import("@types/Data").Status} status this bot's status 🏷️
    * @param {string} [reason] why this bot's status is changing ❓
    */
   async updateStatus(status, reason) {
      void await this.#sendMessage({
         type: `update`,
         status,
         reason
      });
   };


   /**
    * update this bot's usage 🤖
    * @param {number} guildCount this bot's guild count 📂
    */
   async updateUsage(guildCount) {
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
         memory,
         guildCount
      });
   };


   /**
    * update this bot's usage every 10 or so minutes ⏱️
    * @param {import("discord.js").Client} discord discord client for this bot 🗃️
    */
   updater(discord) {
      // run every 10 minutes
      setInterval(async () => {
         // wait from 5 seconds to 5 minutes, to prevent other clients from sending requests at the same time
         const timeToWait = number(1_000 * 5, 1_000 * 5 * 60);
         await wait(timeToWait);

         try {
            // get guild count
            const guildCount = (await discord.guilds.fetch()).size;

            // send client updates
            await this.updateUsage(guildCount);

         } catch (error) {
            // well that was awkward, an error occurred
            return console.error(error.stack);
         };
      }, 1_000 * 10 * 60);
   };


   /**
    * follow-up to an interaction, warning that this bot will go offline soon to the user ⚠️
    * @param {import("discord.js").Interaction} interaction the interaction to respond to 💬
    */
   async warnOfflineSoon(interaction, developers) {
      const { reason, at } = (await this.#firestore.collection(`stats`).doc(this.id).get()).data().status;

      const embeds = [
         new Discord.EmbedBuilder()
            .setColor(colours.red)
            .setDescription(strip`
               ${emojis.oi} **${interaction.client.user} will be offline soon!**
               > "${reason}"
               > \\~ developers
            `)
            .setTimestamp(at.seconds * 1000)
      ];

      try {
         // attempt to follow-up ephemerally; this *could* have a chance of throwing an error (user deleting message, guild deleted..)
         await interaction.followUp({
            embeds,
            ephemeral: true
         });

      } finally {
         noop;
      };

      return;
   };


   /**
    * respond to an interaction, saying that this bot is currently in maintenance to the user 🔧
    * @param {import("discord.js").Interaction} interaction the interaction to respond to 💬
    */
   async warnMaintenance(interaction) {
      await interaction.deferReply({
         ephemeral: true
      });

      const { reason, at } = (await this.#firestore.collection(`stats`).doc(this.id).get()).data().status;

      const embeds = [
         new Discord.EmbedBuilder()
            .setColor(colours.red)
            .setDescription(strip`
               ${emojis.stop} **${interaction.client.user} is currently in maintenance!**
               > "${reason}"
               > \\~ developers
            `)
            .setTimestamp(at.seconds * 1000)
      ];

      try {
         // attempt to edit the reply; this *could* have a chance of throwing an error (user deleting message, guild deleted..)
         await interaction.editReply({
            embeds
         });

      } finally {
         noop;
      };

      return;
   };


   /**
    * get the global blacklist 📃
    */
   async getGlobalBlacklist() {
      const { users = [] } = (await this.#firestore.collection(`blacklist`).doc(`users`).get()).data() || {};
      return users;
   };


   /**
    * respond to an interaction, saying that this user is on the global blacklist 🚫
    * @param {import("discord.js").Interaction} interaction the interaction to respond to 💬
    * @param {string} supportGuild the support guild for the user to go, in case they want to dispute this 💭
    */
   async warnBlacklisted(interaction, supportGuild) {
      try {
         // attempt to reply to the interaction; this *could* have a chance of throwing an error (channel/guild deleted..)
         await interaction.reply({
            content: strip`
               ${emojis.sweats} **well this is awkward, ${interaction.user}..**
               > you've been blacklisted from using ${interaction.client.user}!
               > if you wish to dispute this decision, join the support server below~
               > ${supportGuild} ${emojis.happ}
            `,
            allowedMentions: {
               parse: []
            },
            ephemeral: true
         });

      } finally {
         noop;
      };

      return;
   };


   /**
    * get the current alert for this bot 🚨
    */
   async getAlert() {
      // get the alert for this id
      const alert = (await this.#firestore.collection(`alert`).doc(this.id).get()).data();

      // this alert is outdated (or it doesn't exist)
      if (alert?.[`alert-ends`].seconds <= Math.floor(Date.now() / 1000))
         return undefined;

      // return the alert
      return alert;
   };


   /**
    * get the current announcement for this bot 📣
    */
   async getAnnouncement() {
      // get the announcement for this id
      const announcement = (await this.#firestore.collection(`announcement`).doc(this.id).get()).data();

      // return the announcement
      return announcement;
   };


};