const { sep } = require("node:path");
const { AttachmentBuilder, bold, ContainerBuilder, heading, hideLinkEmbed, HeadingLevel, MessageFlags, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, subtext, TextDisplayBuilder, ThumbnailBuilder, hyperlink, underline, unorderedList, inlineCode } = require("discord.js");
const { name, version } = require("../../package.json");
const { colours, choice } = require("@magicalbunny31/pawesome-utility-stuffs");


module.exports = async (message, fennec, developers, emojis) => {
   // imports
   const { formatEvalExec } = require("../../");


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


   // developer commands payload
   const components = [
      new ContainerBuilder()
         .setAccentColor(colours.fennec)
         .addSeparatorComponents(
            new SeparatorBuilder()
               .setDivider(true)
               .setSpacing(SeparatorSpacingSize.Small)
         )
         .addTextDisplayComponents(
            new TextDisplayBuilder()
               .setContent(
                  [
                     subtext(`${emojis.laptop} ${bold(`developer commands`)}`),
                     subtext(`${emojis.package} ${inlineCode(name)} ${inlineCode(version)}`)
                  ]
                     .join(`\n`)
               )
         )
   ];

   const addComponents = (...componentsToAdd) => void components[0].spliceComponents(-2, 0, ...componentsToAdd);

   const files = [];

   const addFiles = (...filesToAdd) => void files.push(...filesToAdd);

   const replyToMessage = async () => await message.reply({
      components,
      files,
      flags: [
         MessageFlags.IsComponentsV2
      ],
      allowedMentions: {
         repliedUser: false
      }
   });


   // functions to send a fennec log when developer commands are run
   const postFennecLog = async content => await fennec.postLog(
      [
         `💻 developer commands`,
         `📦 ${name} ${version}`,
         ``,
         `🏷️ ${commandName}`,
         `👤 @${message.author.username} (${message.author.id})`,
         `🏡 ${message.guild.name} (${message.guild.id})`,
         `#️⃣ #${message.channel.name} (${message.channel.id})`,
         ``,
         content
      ]
         .join(`\n`),
      message.createdAt
   );

   const formatCode = (code, emoji) => code
      .split(`\n`)
      .map(code => `${emoji} ${code}`)
      .join(`\n`);

   const postFennecLogEvaluate = async (input, output) => {
      const content = [ input, output ].join(`\n`);
      return await postFennecLog(content);
   };


   // commands
   switch (commandName) {


      // this is hard-coded! update accordingly~
      case `help`: {
         // send typing to the channel
         await message.channel.sendTyping();

         // reply to the message
         addComponents(
            new SectionBuilder()
               .setThumbnailAccessory(
                  new ThumbnailBuilder()
                     .setURL(`attachment://fennec.webp`)
               )
               .addTextDisplayComponents(
                  new TextDisplayBuilder()
                     .setContent(
                        unorderedList([
                           bold(`${message.client.user} help`),
                           [
                              `see this command ??`,
                              `yes, that's the help command !!`
                           ],
                           bold(`${message.client.user} evaluate ${underline(inlineCode(`code`))}`),
                           [
                              `evaluate some (arbitrary) javascript code on this process`
                           ],
                           bold(`${message.client.user} ephemeral-evaluate ${underline(inlineCode(`code`))}`),
                           [
                              `basically evaluate except it doesn't respond with anything`
                           ],
                           bold(`${message.client.user} restart`),
                           [
                              `this kinda just calls ${inlineCode(`process.exit(0)`)} on the process and lets the process manager, like ${hyperlink(`PM2`, hideLinkEmbed(`https://pm2.io/`))} or ${hyperlink(`Docker`, hideLinkEmbed(`https://www.docker.com/`))}, restart the process for you`,
                              `note that this will just kill the process if it's not managed by a process manager or if programmed to not restart automatically`
                           ]
                        ])
                     )
               )
         );

         addFiles(
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
         );

         await replyToMessage();

         // break out
         break;
      };


      case `evaluate`:
      case `ephemeral-evaluate`: {
         // variables to expose
         const Discord = require("discord.js");

         // is this command ephemeral-evaluate?
         const isEphemeral = commandName === `ephemeral-evaluate`;

         // evaluate arguments
         const code = message.content
            .slice(message.content.indexOf(commandName) + commandName.length)
            .trim();

         // send typing to the channel
         if (!isEphemeral)
            await message.channel.sendTyping();

         // there's nothing to evaluate
         if (!code) {
            addComponents(
               new TextDisplayBuilder()
                  .setContent(
                     [
                        heading(`${emojis.no} no code to evaluate`, HeadingLevel.Three),
                        unorderedList([
                           `input something maybe~ ${emojis.mhn}`
                        ])
                     ]
                        .join(`\n`)
                  )
            );

            await replyToMessage();

            await postFennecLogEvaluate(`📥`, `❌ nothing to evaluate`);

            break;
         };

         // the evaluation string contains blacklisted words
         if ([ `token`, `env` ].some(word => code.toLowerCase().includes(word))) {
            addComponents(
               new TextDisplayBuilder()
                  .setContent(
                     [
                        heading(`${emojis.no} can't evaluate this code`, HeadingLevel.Three),
                        unorderedList([
                           `the input contains a blacklisted word ${emojis.rip}`
                        ])
                     ]
                        .join(`\n`)
                  )
            );

            await replyToMessage();

            await postFennecLogEvaluate(
               formatCode(code, `📥`),
               formatCode(`command was blocked`, `❌`)
            );

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
         if (!isEphemeral) {
            const { components, files } = formatEvalExec(code, output, true, emojis);

            addComponents(...components[0].components);
            addFiles(...files);
            await replyToMessage();

            await postFennecLogEvaluate(
               formatCode(code, `📥`),
               formatCode(`${output}`, `📤`)
            );

            break;
         };

         // break out
         break;
      };


      // this command will only work if the app is managed by a process manager, like pm2 or docker
      case `restart`: {
         // react to the message
         await message.react(
            choice([ emojis.happ, emojis.mhn, emojis.EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE ])
         );

         // stop the process
         process.exit(0);
      };


   };
};