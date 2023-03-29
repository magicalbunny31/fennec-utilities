const Discord = require("discord.js");
const { colours, emojis, choice, noop, strip } = require("@magicalbunny31/awesome-utility-stuff");
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

      void await this.webhook.send({
         threadId: this.threadId,
         content: Discord.codeBlock(`js`, json)
      });
   };


   /**
    * send an error
    * @param {Error} error error data
    * @param {Date | number} timestamp when this error happened
    * @param {import("discord.js").Interaction | string} interactionOrSource the interaction if this was an interaction, or the source for this error
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
      || interaction.customId;

      const type = (() => {
         switch (true) {
            case interactionOrSource.isAnySelectMenu?.():             return `select-menu`;
            case interactionOrSource.isAutocomplete?.():              return `autocomplete`;
            case interactionOrSource.isButton?.():                    return `button`;
            case interactionOrSource.isChatInputCommand?.():          return `chat-input`;
            case interactionOrSource.isMessageContextMenuCommand?.(): return `message`;
            case interactionOrSource.isModalSubmit?.():               return `modal-submit`;
            case interactionOrSource.isUserContextMenuCommand?.():    return `user`;
            default:                                                  return `unknown`;
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
         interaction: (name && type)
            ? {
               id: interactionOrSource.id,
               name,
               type
            }
            : `${interactionOrSource}`
      });
   };


   /**
    * responds to an interaction, showing an error to the user
    * @param {import("discord.js").Interaction} interaction the interaction to respond to
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

      } finally {
         // this *could* have a chance of throwing an error (user deleting message, guild deleted..)
         try {
            await interaction.editReply({
               content: null,
               embeds,
               files: [],
               components: []
            });

         } catch {
            noop;
         };
      };

      return;
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
    * @param {import("@types/Data").Status} status this bot's status
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