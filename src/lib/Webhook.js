const { WebhookClient, RichEmbed } = require('discord.js');

module.exports = class Webhook extends WebhookClient {
   constructor(...args) {
      super(...args);
   }

   async fire(webhookType, args) {
      if (!constants.webhookTypes.includes(webhookType)) return logger.error(constants.invalidWebhookType);

      let success = false;
      let fields = [];
      let embed = new RichEmbed();

      // On Success 
      if ([
         'giveawayWin',
         'codeSuccess',
         'giveawayEntered'
      ].includes(webhookType)) success = true;

      // On Fail
      if (!settings.webhook.enabled[webhookType]) return;

      let {
         time,
         code,
         type,
         author,
         location,
         server,
         channel,
         timeTook,
         prize
      } = args;

      // Init fields
      switch (webhookType) {
         case 'codeInvalid':
         case 'codeAlreadyRedeemed':
            fields = constants.fields.codeFail(time, code, location);
            break;
         case 'codeSuccess':
            fields = constants.fields.codeSuccess(time, code, type, location);
            break;
         case 'giveawayEntered':
            fields = constants.fields.giveawayEntered(server, channel, timeTook, prize);
            break;
         case 'giveawayWin':
            fields = constants.fields.giveawayWin(server, channel, prize);
            break;
      }

      // Add fields
      for (const field of fields) {
         embed.addField(field.key, field.value, field.inline);
      }

      // Set misc
      embed.setTitle(constants.titles[webhookType]);
      embed.setColor(success ? constants.colors.success : constants.colors.error);
      if (author) embed.setFooter(author);
      embed.setTimestamp();

      // Grab mention settings
      let { webhook: { mentionEveryone } } = settings;
      let mention = mentionEveryone[webhookType];

      // Fire webhook
      return this.send(mention ? '@everyone' : '', { embeds: [embed] }).catch(() => logger.error(constants.webhookCantReach));
   }
};