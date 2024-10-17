const { setIntervalAsync } = require("set-interval-async");


const Methods = {
   Delete: `DELETE`,
   Get: `GET`,
   Post: `POST`
};


const HTTPStatusCodes = {
   NoContent: 204,
   Forbidden: 403,
   NotFound: 404,
   Conflict: 409,
   InternalServerError: 500
};


const Routes = {
   Announcement: `/announcement`,
   ApplicationStatusApplicationStatisticsStatus: `/application-status/application-statistics/status`,
   Blacklist: `/blacklist`,
   BlacklistUser: userId => `/blacklist/${userId}`,
   GuildInvite: `/guild-invite`,
   Log: `/log`,
   LogError: `/log/error`,
   UpdateOnlineStatus: `/update-online-status`
};


module.exports = class FennecClient {


   #baseUrl;
   #authorisation;
   #initialised = false;
   #notInitialisedError = new Error(`🚫 class FennecClient method #initialise() not run yet`);
   #blacklistCache;


   constructor(baseUrl, authorisation) {
      // missing arguments
      if (!baseUrl || !authorisation)
         throw new Error(`🚫 missing required arguments \`url\` and/or \`authorisation\` on class FennecClient instantiation`);

      // set private attributes
      this.#baseUrl = baseUrl;
      this.#authorisation = authorisation;
   };


   async #sendRequest(method, route, body) {
      // send response
      const response = await fetch(`${this.#baseUrl}${route}`, {
         method,
         headers: {
            Authorization: this.#authorisation,
            ...body
               ? { "Content-Type": `application-json` }
               : {}
         },
         body
      });

      // return response data
      return response.status === HTTPStatusCodes.NoContent
         ? {}
         : await response.json();
   };


   async #updateBlacklistCache() {
      // get blacklisted users
      const blacklist = await this.#sendRequest(Methods.Get, Routes.Blacklist);

      // update the cache
      this.#blacklistCache = {
         blacklist,
         lastUpdatedAt: new Date()
      };
   };


   async #updateOnlineStatus() {
      await this.#sendRequest(Methods.Post, Routes.UpdateOnlineStatus);
   };


   async initialise() {
      // client already initialised
      if (this.#initialised)
         throw new Error(`🚫 class FennecClient method #initialise() has already been run`);

      // methods to run
      const intervalFunction = async () => {
         await this.#updateBlacklistCache();
         await this.#updateOnlineStatus();
      };

      // run methods first time
      await intervalFunction();

      // run methods every 15 minutes
      const fifteenMinutes = 15 * 60 * 1000;
      setIntervalAsync(intervalFunction, fifteenMinutes);

      // client initialised
      this.#initialised = true;
   };


   isOnBlacklist(userId) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // check if this userId is on the blacklist cache
      const { data: blacklist } = this.#blacklistCache.blacklist;
      return blacklist.includes(userId);
   };


   async getUserBlacklistInfo(userId) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // get blacklist data about this userId
      const response = await this.#sendRequest(Methods.Get, Routes.BlacklistUser(userId));

      // no status
      if (response.status === HTTPStatusCodes.NotFound)
         return undefined;

      // format data
      return {
         by: response.data.by,
         at: new Date(Date.parse(response.data.at)),
         reason: response.data.reason,
         ...response.data.delete
            ? {
               delete: new Date(Date.parse(response.data.delete))
            }
            : {}
      };
   };


   async addToBlacklist(userId, byUserId, at, reason) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // reason too long
      if (reason.length > 1024)
         throw new Error (`🚫 reason argument for FennecClient.addToBlacklist() too long`);

      // reason is multiline
      if (/\r|\n/.test(reason))
         throw new Error (`🚫 reason argument for FennecClient.addToBlacklist() is multiline`);

      // request body
      const body = JSON.stringify({
         by: byUserId,
         at: at.getTime(),
         reason
      });

      // add to blacklist
      const response = await this.#sendRequest(Methods.Post, Routes.BlacklistUser(userId), body);

      // can't use this endpoint
      if (response.status === HTTPStatusCodes.Forbidden)
         throw new Error(`🚫 insufficient permissions to use FennecClient.addToBlacklist()`);

      // already on blacklist
      else if (response.status === HTTPStatusCodes.Conflict)
         throw new Error(`🚫 userId "${userId}" is already on FennecClient.addToBlacklist()`);

      // other error
      else if (response.status === HTTPStatusCodes.InternalServerError)
         throw new Error(`🚫 error at FennecClient.addToBlacklist()\n\n${response.data}`);
   };


   async removeFromBlacklist(userId) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // remove from blacklist
      const response = await this.#sendRequest(Methods.Delete, Routes.BlacklistUser(userId));

      // can't use this endpoint
      if (response.status === HTTPStatusCodes.Forbidden)
         throw new Error(`🚫 insufficient permissions to use FennecClient.removeFromBlacklist()`);

      // other error
      else if (response.status === HTTPStatusCodes.InternalServerError)
         throw new Error(`🚫 error at FennecClient.addToBlacklist()\n\n${response.data}`);
   };


   async getGuildInvite() {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // get guild invite
      const guildInviteData = await this.#sendRequest(Methods.Get, Routes.GuildInvite);

      // return guild invite
      return guildInviteData.data?.[`guild-invite`];
   };


   async postLog(content, at) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // request body
      const body = JSON.stringify({
         content,
         at: at.getTime()
      });

      // send log
      await this.#sendRequest(Methods.Post, Routes.Log, body);
   };


   async postErrorLog(error, source, at, interactionId) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // request body
      const body = JSON.stringify({
         error: {
            name: error.name,
            message: error.message,
            stack: error.stack
         },
         source,
         interactionId,
         at: at.getTime()
      });

      // send log
      await this.#sendRequest(Methods.Post, Routes.LogError, body);
   };


   async getApplicationStatusApplicationStatisticsStatus() {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // get application status data
      const response = await this.#sendRequest(Methods.Get, Routes.ApplicationStatusApplicationStatisticsStatus);

      // no status
      if (response.status === HTTPStatusCodes.NotFound)
         return undefined;

      // return application status data
      return {
         name: response.data.name,
         ...response.data.message
            ? {
               message: response.data.message
            }
            : {},
         at: new Date(Date.parse(response.data.at))
      };
   };


   async getAnnouncement() {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // get announcement data
      const response = await this.#sendRequest(Methods.Get, Routes.Announcement);

      // no status
      if (response.status === HTTPStatusCodes.NotFound)
         return undefined;

      // return announcement data
      return {
         message: response.data.message,
         at: new Date(Date.parse(response.data.at)),
         ...response.data.delete
            ? {
               delete: new Date(Date.parse(response.data.delete))
            }
            : {}
      };
   };


};