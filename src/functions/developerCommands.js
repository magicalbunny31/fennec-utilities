const path = require("path");
const Discord = require("discord.js");

const { Firestore } = require("@google-cloud/firestore");

const { colours, emojis, strip } = require("@magicalbunny31/awesome-utility-stuff");

const { name, version } = require("../../package.json");

/**
 * fennec-utilities developer commands 💻
 * @param {Discord.Message} message [discord.js](https://discord.js.org)' message object, found when a [`Message`](https://discord.js.org/#/docs/discord.js/main/class/Message) event is fired from the [`Client`](https://discord.js.org/#/docs/discord.js/main/class/Client) 💬
 * @param {import("../../").Client} fennec this fennec client 🦊
 * @param {Discord.Snowflake[]} developers array of users which can use these commands 🤖
 * @param {import("../../types/Data").FennecFirestore} fennecFirestore credentials for fennec's [`@google-cloud/firestore`](https://cloud.google.com/firestore) 📦
 * @returns {Promise<void>} stuff happens, the function runs. what else do we need to return? 📰
 */
module.exports = async (message, fennec, developers, fennecFirestore) => {
   // firestore
   const firestore = new Firestore({
      credentials: {
         client_email: fennecFirestore.clientEmail,
         private_key: fennecFirestore.privateKey
      },
      projectId: fennecFirestore.projectId
   });


   // ignore bots and webhooks
   if (message.author.bot || message.webhookId)
      return;


   // not a developer
   if (!developers.includes(message.author.id))
      return;


   // regular expression to match if this message has a prefix for the bot (@mentions only)
   const prefixRegexp = new RegExp(`^(<@!?${message.client.user.id}>)\\s*`);


   // this isn't a command string
   const commandContent = message.content.toLowerCase();

   if (!prefixRegexp.test(commandContent))
      return;


   // command information
   const [ _, matchedPrefix ] = commandContent.match(prefixRegexp);
   const [ commandName, ...args ] = message.content.slice(matchedPrefix.length).trim().split(/ +/);


   // developer commands embed
   const developerCommandsEmbed = new Discord.EmbedBuilder()
      .setColor(colours.fennec)
      .setFooter({
         text: strip`
            💻 developer commands
            📦 ${name} ${version}
         `,
         iconURL: `attachment://fennec.png`
      });

   const developerCommandsFiles = [
      new Discord.AttachmentBuilder()
         .setFile(
            [
               ...__dirname
                  .split(path.sep)
                  .slice(0, -2),
               `assets`,
               `fennec.png`
            ]
               .join(path.sep)
         )
   ];


   // commands
   switch (commandName) {


      /* evaluate */
      case `ephemeral-evaluate`:
      case `evaluate`: {
         // ephemeral?
         const isEphemeral = commandName === `ephemeral-evaluate`;

         // args
         const code = message.content
            .slice(message.content.indexOf(commandName) + commandName.length)
            .trim();

         // send typing
         if (!isEphemeral)
            await message.channel.sendTyping();

         // nothing to evaluate
         if (!code) {
            await message.reply({
               embeds: [
                  developerCommandsEmbed
                     .setDescription(strip`
                        ${emojis.no} **no code to evaluate!**
                        > input something maybe~ ${emojis.mhn}
                     `)
               ],
               files: developerCommandsFiles,
               allowedMentions: {
                  repliedUser: false
               }
            });

            break;
         };

         // code contains "token" or "env"
         if ([ `token`, `env` ].some(word => code.includes(word))) {
            await message.reply({
               embeds: [
                  developerCommandsEmbed
                     .setDescription(strip`
                        ${emojis.no} **can't evaluate this code..**
                        > a blacklisted word was found ${emojis.rip}
                     `)
               ],
               files: developerCommandsFiles,
               allowedMentions: {
                  repliedUser: false
               }
            });

            break;
         };

         // evaluate the code
         const output = await (async () => {
            try {
               return await eval(`(async () => { return ${code} })()`);
            } catch {
               try {
                  return await eval(`(async () => { ${code} })()`);
               } catch (error) {
                  return error;
               };
            };
         })();

         // reply to the message
         if (!isEphemeral)
            await message.reply({
               embeds: [
                  developerCommandsEmbed
                     .setFields({
                        name: `${emojis.envelope_with_arrow} input`,
                        value: Discord.codeBlock(
                           `js`,
                           Discord.codeBlock(`js`, code).length > 1024
                              ? strip`
                                 ${code.slice(0, 1016)}
                                 // ...
                              `
                              : code
                        )
                     }, {
                        name: `${emojis.laptop} output`,
                        value: Discord.codeBlock(
                           `js`,
                           Discord.codeBlock(`js`, output).length > 1024
                              ? strip`
                                 ${output.slice(0, 1016)}
                                 // ...
                              `
                              : output
                        )
                     })
               ],
               files: [
                  ...developerCommandsFiles,
                  ...Discord.codeBlock(`js`, code).length > 1024
                     ? [
                        new Discord.AttachmentBuilder()
                           .setFile(
                              Buffer.from(code)
                           )
                           .setName(`input.js`)
                     ]
                     : [],
                  ...Discord.codeBlock(`js`, output).length > 1024
                     ? [
                        new Discord.AttachmentBuilder()
                           .setFile(
                              Buffer.from(output)
                           )
                           .setName(`output.js`)
                     ]
                     : []
               ],
               allowedMentions: {
                  repliedUser: false
               }
            });

         // stop here
         break;
      };


      /* help */
      // this is hard-coded! update accordingly~
      case `help`: {
         // send typing to the channel
         await message.channel.sendTyping();

         // reply to the message
         await message.reply({
            embeds: [
               developerCommandsEmbed
                  .setDescription(strip`
                     ${message.client.user} **ephemeral-evaluate** \`<code>\`
                     > basically evaluate except it doesn't respond with anything

                     ${message.client.user} **evaluate** \`<code>\`
                     > evaluate some javascript code on this process

                     ${message.client.user} **help**
                     > see this command?? yes, that's the help command!!

                     ${message.client.user} **restart**
                     > restart the bot
                     > - if this process isn't managed by a process manager, it won't restart~

                     ${message.client.user} **status** \`<online | offline-soon | maintenance>\` \`<reason>?\`
                     > changes this bot's set status
                     > - \`<online>\` : normal usage (\`<reason>\` isn't required if changing to \`online\`)
                     > - \`<offline-soon>\` : changes discord status and warns non-developers of downtime soon
                     > - \`<maintenance>\` : commands cannot be used by non-developers

                     ${message.client.user} **to-do**
                     > view all to-do items for this bot

                     ${message.client.user} **to-do add** \`<item name>\`
                     > adds a to-do item for this bot

                     ${message.client.user} **to-do remove** \`<item index>\`
                     > removes a to-do item with this index for this bot
                  `)
            ],
            files: developerCommandsFiles,
            allowedMentions: {
               repliedUser: false
            }
         });

         // stop here
         break;
      };


      /* restart */
      // this command will only work if managed by a process manager, like pm2
      case `restart`: {
         // react to the message
         await message.react(emojis.happ);

         // stop the process
         process.exit(0);
      };


      /* status */
      case `status`: {
         // args
         const [ status ] = args;
         const reason = message.content
            .slice(message.content.indexOf(status) + status.length)
            .trim();

         // not a status
         if (![ `online`, `offline-soon`, `maintenance` ].includes(status)) {
            await message.reply({
               embeds: [
                  developerCommandsEmbed
                     .setDescription(strip`
                        ${emojis.no} **\`${status}\` isn't a valid status..**
                        > it must be one of: \`online\` | \`offline soon\` | \`maintenance\` ${emojis.mhn}
                     `)
               ],
               files: developerCommandsFiles,
               allowedMentions: {
                  repliedUser: false
               }
            });

            // stop here
            break;
         };

         // no reason (and not changing to online)
         if (!reason && [ `offline-soon`, `maintenance` ].includes(status)) {
            await message.reply({
               embeds: [
                  developerCommandsEmbed
                     .setDescription(strip`
                        ${emojis.no} **you need to input a reason!**
                        > for example: why's ${message.client.user}'s status changing to \`${status}\`? ${emojis.mhn}
                     `)
               ],
               files: developerCommandsFiles,
               allowedMentions: {
                  repliedUser: false
               }
            });

            // stop here
            break;
         };

         // change status, it's that easy!
         fennec.updateStatus(status, reason);

         // react to the message
         await message.react(emojis.yes);

         // stop here
         break;
      };


      /* to-do */
      case `to-do`: {
         // send typing
         await message.channel.sendTyping();

         // database path for to-dos
         const database = firestore.collection(`to-do`).doc(fennec.id);
         const docExists = !!(await database.get(`items`)).data();
         const { items = [] } = (await database.get(`items`)).data() || {};


         switch (args[0]) {


            // view all to-do items for this bot
            default: {
               await message.reply({
                  embeds: [
                     developerCommandsEmbed
                        .setDescription(
                           items
                              .map((item, i) => `**\`${i}\`** : ${item}`)
                              .join(`\n`)
                           || `**\`no to-do items..\`** ${emojis.rip}`
                        )
                  ],
                  files: developerCommandsFiles,
                  allowedMentions: {
                     repliedUser: false
                  }
               });

               break;
            };


            // add a to-do item to this bot
            case `add`: {
               const item = message.content
                  .slice(message.content.indexOf(args[0]) + args[0].length)
                  .trim();

               if (!item) {
                  await message.reply({
                     embeds: [
                        developerCommandsEmbed
                           .setDescription(strip`
                              ${emojis.no} **no item to add!**
                              > input something maybe~ ${emojis.mhn}
                           `)
                     ],
                     files: developerCommandsFiles,
                     allowedMentions: {
                        repliedUser: false
                     }
                  });

                  break;
               };

               items.push(item);

               if (docExists)
                  await database.update({ items });
               else
                  await database.set({ items });

               await message.reply({
                  embeds: [
                     developerCommandsEmbed
                        .setDescription(strip`
                           ${emojis.yes} **added to-do item~**
                           > view current to-dos with ${message.client.user} **to-do** ${emojis.mhn}
                        `)
                  ],
                  files: developerCommandsFiles,
                  allowedMentions: {
                     repliedUser: false
                  }
               });

               break;
            };


            // removes a to-do item at this index from this bot
            case `remove`: {
               const index = +args[1];

               if (isNaN(index)) {
                  await message.reply({
                     embeds: [
                        developerCommandsEmbed
                           .setDescription(strip`
                              ${emojis.no} **\`${args[1]}\` isn't a valid index..**
                              > it must be an integer ${emojis.mhn}
                           `)
                     ],
                     files: developerCommandsFiles,
                     allowedMentions: {
                        repliedUser: false
                     }
                  });

                  break;
               };

               if (index < 0) {
                  await message.reply({
                     embeds: [
                        developerCommandsEmbed
                           .setDescription(strip`
                              ${emojis.no} **to-do index \`${index}\` is out of range..**
                              > choose a higher number ${emojis.mhn}
                           `)
                     ],
                     files: developerCommandsFiles,
                     allowedMentions: {
                        repliedUser: false
                     }
                  });

                  break;
               };

               if (index + 1 > items.length) {
                  await message.reply({
                     embeds: [
                        developerCommandsEmbed
                           .setDescription(strip`
                              ${emojis.no} **to-do index \`${index}\` is out of range..**
                              > choose a lower number ${emojis.mhn}
                           `)
                     ],
                     files: developerCommandsFiles,
                     allowedMentions: {
                        repliedUser: false
                     }
                  });

                  break;
               };

               items.splice(index, 1);

               if (docExists)
                  await database.update({ items });
               else
                  await database.set({ items });

               await message.reply({
                  embeds: [
                     developerCommandsEmbed
                        .setDescription(strip`
                           ${emojis.yes} **removed to-do item~**
                           > view current to-dos with ${message.client.user} **to-do** ${emojis.mhn}
                        `)
                  ],
                  files: developerCommandsFiles,
                  allowedMentions: {
                     repliedUser: false
                  }
               });

               break;
            };


         };
      };


      // not a command
      default: break;


   };


   // return nothing!!
   return;
};