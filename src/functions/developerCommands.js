const { sep } = require("node:path");
const { AttachmentBuilder, codeBlock, EmbedBuilder, heading, HeadingLevel, hyperlink, underline, unorderedList, inlineCode } = require("discord.js");
const { colours, strip } = require("@magicalbunny31/pawesome-utility-stuffs");
const { name, version } = require("../../package.json");


module.exports = async (message, developers, emojis) => {
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
   const developerCommandsEmbed = new EmbedBuilder()
      .setColor(colours.fennec)
      .setFooter({
         text: strip`
            💻 developer commands
            📦 ${name} ${version}
         `,
         iconURL: `attachment://fennec.webp`
      });

   const developerCommandsFiles = [
      new AttachmentBuilder()
         .setFile(
            [
               ...__dirname
                  .split(sep)
                  .slice(0, -2),
               `assets`,
               `fennec.webp`
            ]
               .join(sep)
         )
   ];


   // commands
   switch (commandName) {


      /* evaluate */
      case `ephemeral-evaluate`:
      case `evaluate`: {
         // variables to expose
         const Discord = require("discord.js");

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
                     .setDescription(
                        [
                           heading(`${emojis.no} no code to evaluate!`, HeadingLevel.Three),
                           unorderedList([
                              `input something maybe~ ${emojis.mhn}`
                           ])
                        ]
                           .join(`\n`)
                     )
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
                     .setDescription(
                        [
                           heading(`${emojis.no} can't evaluate this code..`, HeadingLevel.Three),
                           unorderedList([
                              `a blacklisted word was found ${emojis.rip}`
                           ])
                        ]
                           .join(`\n`)
                     )
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
                  return error?.message;
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
                        value: codeBlock(
                           `js`,
                           codeBlock(`js`, code).length > 1024
                              ? [
                                 code.slice(0, 1024 - 28),
                                 `// no input..?`
                              ]
                                 .join(`\n`)
                              : code
                        )
                     }, {
                        name: `${emojis.laptop} output`,
                        value: codeBlock(
                           `js`,
                           codeBlock(`js`, `${output}`).length > 1024
                              ? [
                                 `${output}`.slice(0, 1024 - 28),
                                 `// no output..?`
                              ]
                                 .join(`\n`)
                              : `${output}`
                        )
                     })
               ],
               files: [
                  ...developerCommandsFiles,
                  ...codeBlock(`js`, code).length > 1024
                     ? [
                        new AttachmentBuilder()
                           .setFile(
                              Buffer.from(code)
                           )
                           .setName(`input.js`)
                     ]
                     : [],
                  ...codeBlock(`js`, `${output}`).length > 1024
                     ? [
                        new AttachmentBuilder()
                           .setFile(
                              Buffer.from(`${output}`)
                           )
                           .setName(`output.js`)
                     ]
                     : []
               ],
               allowedMentions: {
                  repliedUser: false
               }
            });

         // break out
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
                  .setDescription(
                     [
                        heading(`${message.client.user} ephemeral-evaluate ${underline(inlineCode(`code`))}`, HeadingLevel.Three),
                        unorderedList([
                           `basically evaluate except it doesn't respond with anything`
                        ]),
                        heading(`${message.client.user} evaluate ${underline(inlineCode(`code`))}`, HeadingLevel.Three),
                        unorderedList([
                           `evaluate some js code on this process`
                        ]),
                        heading(`${message.client.user} help`, HeadingLevel.Three),
                        unorderedList([
                           `see this command ??`,
                           [
                              `yes, that's the help command !!`
                           ]
                        ]),
                        heading(`${message.client.user} restart`, HeadingLevel.Three),
                        unorderedList([
                           `"restarts" the bot`,
                           [
                              `..this kinda just calls ${inlineCode(`process.exit(0)`)} on the code and lets the process manager, like ${hyperlink(`pm2`, `https://pm2.io`)}, restart the process for you`,
                              `note that this will just kill the process if it's not managed by a process manager or if programmed to not restart automatically`
                           ]
                        ])
                     ]
                        .join(`\n`)
                  )
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


   };
};