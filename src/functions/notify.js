const { ActionRowBuilder, bold, ButtonBuilder, ButtonStyle, ContainerBuilder, heading, HeadingLevel, hyperlink, MessageFlags, quote, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, time, unorderedList } = require("discord.js");
const { colours } = require("@magicalbunny31/pawesome-utility-stuffs");


module.exports = async (interaction, fennec, notificationType, emojis) => {
   // imports
   const { DefaultGuildInvite, NotificationType, TermsOfService } = require("../../");


   // this function was likely called before the interaction, so block it by responding now
   const blockInteraction = [ NotificationType.Blacklist, NotificationType.Offline ].includes(notificationType);

   if (blockInteraction)
      await interaction.deferReply({
         flags: [
            MessageFlags.Ephemeral
         ]
      });


   // this is an announcement, however stop here if this person has already seen the announcement
   if (notificationType === NotificationType.Announcement) {
      const hasSeenAnnouncement = fennec.hasSeenAnnouncement(interaction.user.id);

      if (hasSeenAnnouncement)
         return;
   };


   // this person's accent colour
   const accentColour = interaction.user.accentColor
      || (await interaction.user.fetch(true)).accentColor
      || colours.fennec;


   // get this application's support guild
   const guild = await fennec.getGuildInvite() ?? DefaultGuildInvite;


   // get the message payload depending on the notificationType
   const payload = await (async () => {
      switch (notificationType) {
         case NotificationType.Announcement:
            const announcement = fennec.getAnnouncement();
            return {
               components: [
                  new ContainerBuilder()
                     .setAccentColor(colours.bunny_pink)
                     .addTextDisplayComponents(
                        new TextDisplayBuilder()
                           .setContent(
                              [
                                 heading(`${emojis.awoo} announcement`, HeadingLevel.Two),
                                 announcement.message
                              ]
                                 .join(`\n`)
                           )
                     )
                     .addSeparatorComponents(
                        new SeparatorBuilder()
                           .setDivider(true)
                           .setSpacing(SeparatorSpacingSize.Small)
                     )
                     .addSectionComponents(
                        new SectionBuilder()
                           .addTextDisplayComponents(
                              new TextDisplayBuilder()
                                 .setContent(`${emojis.watch} ${time(announcement.at)}`)
                           )
                           .setButtonAccessory(
                              new ButtonBuilder()
                                 .setLabel(`support server`)
                                 .setEmoji(emojis.discord)
                                 .setStyle(ButtonStyle.Link)
                                 .setURL(guild)
                           )
                     )
               ],
               flags: [
                  MessageFlags.Ephemeral,
                  MessageFlags.IsComponentsV2
               ]
            };

         case NotificationType.Blacklist:
            const blacklistInfo = await fennec.getUserBlacklistInfo(interaction.user.id);
            const payload = {
               components: [
                  new ContainerBuilder()
                     .setAccentColor(colours.red)
                     .addTextDisplayComponents(
                        new TextDisplayBuilder()
                           .setContent(
                              [
                                 heading(`${emojis.haha_uhh} well, this is awkward..`, HeadingLevel.Three),
                                 unorderedList([
                                    `you've been blacklisted from using ${interaction.client.user}..`,
                                    [
                                       `being on the blacklist means you will be unable to use all services mentioned in the ${emojis.yellow_book} ${hyperlink(`terms of service`, TermsOfService)}`
                                    ],
                                    `if you think this decision was in error, join the ${emojis.discord} ${hyperlink(`support server`, guild)} to dispute it`,
                                    `information about your blacklist can be found below~`
                                 ])
                              ]
                                 .join(`\n`)
                           )
                     )
                     .addActionRowComponents(
                        new ActionRowBuilder()
                           .setComponents(
                              new ButtonBuilder()
                                 .setLabel(`terms of service`)
                                 .setEmoji(emojis.yellow_book)
                                 .setStyle(ButtonStyle.Link)
                                 .setURL(TermsOfService),
                              new ButtonBuilder()
                                 .setLabel(`support server`)
                                 .setEmoji(emojis.discord)
                                 .setStyle(ButtonStyle.Link)
                                 .setURL(guild)
                           )
                     ),
                  new ContainerBuilder()
                     .setAccentColor(accentColour)
                     .addTextDisplayComponents(
                        new TextDisplayBuilder()
                           .setContent(
                              unorderedList([
                                 `${bold(`${emojis.calendar_spiral} you were added to the blacklist at`)}: ${time(blacklistInfo?.at)}`,
                                 blacklistInfo?.delete
                                    ? `${bold(`${emojis.watch} you will be removed from the blacklist at`)}: ${time(blacklistInfo.delete)}`
                                    : bold(`${emojis.watch} you will not be removed from the blacklist`)
                              ])
                           )
                     )
                     .addSeparatorComponents(
                        new SeparatorBuilder()
                           .setDivider(true)
                           .setSpacing(SeparatorSpacingSize.Small)
                     )
                     .addTextDisplayComponents(
                        new TextDisplayBuilder()
                           .setContent(
                              [
                                 heading(`${emojis.curled_page} why you are on the blacklist`, HeadingLevel.Three),
                                 quote(blacklistInfo?.reason)
                              ]
                                 .join(`\n`)
                           )
                     )
               ],
               allowedMentions: {
                  parse: []
               },
               flags: [
                  MessageFlags.IsComponentsV2
               ]
            };
            if (!blacklistInfo)
               payload.components[1]
                  .spliceComponents(0, 3,
                     new TextDisplayBuilder()
                        .setContent(
                           unorderedList([
                              `your blacklist has expired and you are confirmed to not be on it anymore! ${emojis.yaya}`,
                              `however, the blacklist is updated internally every 15 minutes: you must wait a little while until you are able to use ${interaction.client.user} again`,
                              [
                                 `see you later, ${interaction.user}~`
                              ]
                           ])
                        )
                  );
            return payload;

         case NotificationType.Offline:
            const status = await fennec.getApplicationStatusApplicationStatisticsStatus();
            return {
               components: [
                  new ContainerBuilder()
                     .setAccentColor(colours.grey)
                     .addTextDisplayComponents(
                        new TextDisplayBuilder()
                           .setContent(
                              [
                                 heading(`${emojis.stop} technical difficulties..`, HeadingLevel.Three),
                                 unorderedList([
                                    `${interaction.client.user} has been marked offline by the developers`,
                                    [
                                       `this means that you will be unable to use this app's commands until the developers mark it as online again`
                                    ],
                                    `for any queries, join the ${emojis.discord} ${hyperlink(`support server`, guild)}`,
                                    `information about this can be found below~`
                                 ])
                              ]
                                 .join(`\n`)
                           )
                     ),
                  new ContainerBuilder()
                     .setAccentColor(colours.light_grey)
                     .addTextDisplayComponents(
                        new TextDisplayBuilder()
                           .setContent(status.message)
                     )
                     .addSeparatorComponents(
                        new SeparatorBuilder()
                           .setDivider(true)
                           .setSpacing(SeparatorSpacingSize.Small)
                     )
                     .addSectionComponents(
                        new SectionBuilder()
                           .addTextDisplayComponents(
                              new TextDisplayBuilder()
                                 .setContent(`${emojis.watch} ${time(status.at)}`)
                           )
                           .setButtonAccessory(
                              new ButtonBuilder()
                                 .setLabel(`support server`)
                                 .setEmoji(emojis.discord)
                                 .setStyle(ButtonStyle.Link)
                                 .setURL(guild)
                           )
                     )
               ],
               flags: [
                  MessageFlags.IsComponentsV2
               ]
            };
      };
   })();


   // respond to the interaction
   if (blockInteraction)
      await interaction.editReply(payload);

   else
      await interaction.followUp(payload);


   // this was an announcement, so this person has now seen the announcement
   await fennec.setSeenAnnouncement(interaction.user.id);
};