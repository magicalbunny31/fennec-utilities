const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, hyperlink, quote, time, unorderedList } = require("discord.js");
const { colours } = require("@magicalbunny31/pawesome-utility-stuffs");


module.exports = async (interaction, fennec, notificationType, emojis) => {
   // imports
   const { NotificationType, TermsOfService } = require("../../");


   // this function was likely called before the interaction, so block it by responding now
   const blockInteraction = [ NotificationType.Blacklist, NotificationType.Offline ].includes(notificationType);

   if (blockInteraction)
      await interaction.deferReply({
         ephemeral: true
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


   // get this application's support guild (it *should* have a support guild set if it is notifying people..)
   const guild = await fennec.getGuildInvite();


   // get the message payload depending on the notificationType
   const payload = await (async () => {
      switch (notificationType) {
         case NotificationType.Announcement:
            const announcement = fennec.getAnnouncement();
            return {
               embeds: [
                  new EmbedBuilder()
                     .setColor(colours.bunny_pink)
                     .setTitle(`${emojis.awoo} announcement`)
                     .setDescription(announcement.message)
                     .setTimestamp(announcement.at)
               ],
               components: [
                  new ActionRowBuilder()
                     .setComponents(
                        new ButtonBuilder()
                           .setLabel(`support server`)
                           .setEmoji(emojis.discord)
                           .setStyle(ButtonStyle.Link)
                           .setURL(guild)
                     )
               ],
               ephemeral: true
            };

         case NotificationType.Blacklist:
            const blacklistInfo = await fennec.getUserBlacklistInfo(interaction.user.id);
            return {
               embeds: [
                  new EmbedBuilder()
                     .setColor(colours.red)
                     .setTitle(`${emojis.haha_uhh} well, this is awkward..`)
                     .setDescription(
                        unorderedList([
                           `you've been blacklisted from using ${interaction.client.user}..`,
                           [
                              `being on the blacklist means you will be unable to use all services mentioned in the ${emojis.yellow_book} ${hyperlink(`terms of service`, TermsOfService)}`
                           ],
                           `if you think this decision was in error, join the ${hyperlink(`support server`, guild)} to dispute it`,
                           `information about your blacklist can be found below`
                        ])
                     ),
                  new EmbedBuilder()
                     .setColor(accentColour)
                     .setDescription(
                        blacklistInfo
                           ? unorderedList([
                              `your blacklist has expired and you are confirmed to not be on it anymore! ${emojis.yaya}`
                              `however, the blacklist is updated every 15 minutes: you must wait a little while until you are able to use ${interaction.client.user} again`,
                              [
                                 `see you later, ${interaction.user}~`
                              ]
                           ])
                           : null
                     )
                     .setFields(
                        [{
                           name: `${emojis.calendar_spiral} you were added to the blacklist at`,
                           value: blacklistInfo?.at ? time(blacklistInfo.at) : ``,
                           inline: true
                        }, {
                           name: `${emojis.watch} you will be removed from the blacklist at`,
                           value: blacklistInfo?.delete ? time(blacklistInfo.delete) : ``,
                           inline: true
                        }, {
                           name: `${emojis.curled_page} why you are on the blacklist`,
                           value: blacklistInfo?.reason ? quote(blacklistInfo.reason) : ``,
                           inline: false
                        }]
                           .filter(field => field.value)
                     )
               ],
               components: [
                  new ActionRowBuilder()
                     .setComponents(
                        new ButtonBuilder()
                           .setLabel(`support server`)
                           .setEmoji(emojis.discord)
                           .setStyle(ButtonStyle.Link)
                           .setURL(guild),
                        new ButtonBuilder()
                           .setLabel(`terms of service`)
                           .setEmoji(emojis.yellow_book)
                           .setStyle(ButtonStyle.Link)
                           .setURL(TermsOfService)
                     )
               ]
            };

         case NotificationType.Offline:
            const status = await fennec.getApplicationStatusApplicationStatisticsStatus();
            return {
               embeds: [
                  new EmbedBuilder()
                     .setColor(colours.grey)
                     .setTitle(`${emojis.stop} technical difficulties..`)
                     .setDescription(
                        unorderedList([
                           `${interaction.client.user} has been marked offline by the developers`,
                           [
                              `this means that you will be unable to use this app's commands until the developers mark it as online again`
                           ],
                           `for any queries, join the ${hyperlink(`support server`, guild)}`
                           `information about this can be found below`
                        ])
                     ),
                  new EmbedBuilder()
                     .setColor(colours.light_grey)
                     .setFields({
                        name: `${emojis.watch} ${interaction.client.user} was marked offline at`,
                        value: time(status.at)
                     })
                     .setDescription(status)
               ],
               components: [
                  new ActionRowBuilder()
                     .setComponents(
                        new ButtonBuilder()
                           .setLabel(`support server`)
                           .setEmoji(emojis.discord)
                           .setStyle(ButtonStyle.Link)
                           .setURL(guild)
                     )
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