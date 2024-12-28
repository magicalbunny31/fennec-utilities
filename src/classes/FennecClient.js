const { EventEmitter } = require("node:events");
const { wait } = require("@magicalbunny31/pawesome-utility-stuffs");
const { setIntervalAsync } = require("set-interval-async");
const WebSocket = require("ws");


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
   AnnouncementUser: userId => `/announcement/${userId}`,
   AnnouncementUsers: `/announcement/users`,
   ApplicationStatusApplicationStatisticsStatus: `/application-status/application-statistics/status`,
   Blacklist: `/blacklist`,
   BlacklistUser: userId => `/blacklist/${userId}`,
   GuildInvite: `/guild-invite`,
   Log: `/log`,
   LogError: `/log/error`,
   UpdateOnlineStatus: `/update-online-status`
};


module.exports = class FennecClient {


   #fennecOptions;
   #initialised = false;
   #notInitialisedError = new Error(`🚫 FennecClient.initialise() not run yet`);
   #noFennecWebsocketArgs = new Error(`🚫 FennecClient fennecWebsocket arguments are required to use this method`);
   #blacklistCache;
   #notUsingBlacklistCacheError = method => new Error(`🚫 FennecClient.${method}() cannot be used as blacklist cache is set to not update`);
   #applicationStatusApplicationStatisticsStatusCache;
   #notUsingApplicationStatusApplicationStatisticsStatusCacheError = method => new Error(`🚫 FennecClient.${method}() cannot be used as application status' application statistics' status cache is set to not update`);
   #announcementCache;
   #announcementUsersCache;
   #notUsingAnnouncementCache = method => new Error(`🚫 FennecClient.${method}() cannot be used as announcement cache is set to not update`);
   #websocket;
   #websocketHeartbeat;

   fennecWebsocket = new EventEmitter();


   constructor(options) {
      // missing required arguments
      if (!(`fennecUtilities` in options && `fennecProcess` in options))
         throw new Error(`🚫 missing required argument(s) \`fennecUtilities\` and/or \`fennecProcess\` on FennecClient instantiation`);

      // set private attributes
      this.#fennecOptions = options;
   };


   async #sendRequest(method, route, body) {
      // create basic authorisation
      const basic = `${this.#fennecOptions.fennecUtilities.id}:${this.#fennecOptions.fennecUtilities.authorisation}`;
      const encoded = Buffer.from(basic).toString(`base64`);

      // attempts
      let attempts = 0;
      const errors = [];

      while (attempts < 3) {
         // attempt to send a response
         const response = await fetch(`${this.#fennecOptions.fennecUtilities.baseUrl}${route}`, {
            method,
            headers: {
               Authorization: `Basic ${encoded}`,
               ...body
                  ? { "Content-Type": `application/json` }
                  : {}
            },
            body
         });

         if (!response.ok) {
            // bad response
            attempts ++;
            errors.push(`HTTP ${response.status} ${response.statusText}: ${JSON.stringify(await response.text())}}`);
            await wait(1000);

         } else {
            // return response data
            return response.status === HTTPStatusCodes.NoContent
               ? {}
               : await response.json();
         };
      };

      // too many attempts
      throw new Error(
         [
            `🚫 FennecClient tried to #sendRequest to ${route} but failed ${attempts + 1} times, reasons:`,
            ...errors
         ]
            .join(`\n`)
      );
   };


   async #updateBlacklistCache() {
      // don't update this cache
      const useBlacklist = this.#fennecOptions.useBlacklist ?? true;
      if (!useBlacklist)
         return;

      // get blacklisted users
      const response = await this.#sendRequest(Methods.Get, Routes.Blacklist);

      // update the cache
      this.#blacklistCache = {
         blacklist: response.data,
         lastUpdatedAt: new Date()
      };
};


   async #updateApplicationStatusApplicationStatisticsStatusCache() {
      // don't update this cache
      const useApplicationStatusApplicationStatisticsStatus = this.#fennecOptions.useApplicationStatusApplicationStatisticsStatus ?? true;
      if (!useApplicationStatusApplicationStatisticsStatus)
         return;

      // get application status data
      const response = await this.#sendRequest(Methods.Get, Routes.ApplicationStatusApplicationStatisticsStatus);

      this.#applicationStatusApplicationStatisticsStatusCache = {
         applicationStatusApplicationStatisticsStatus: response.status === HTTPStatusCodes.NotFound
            ? undefined
            : {
               name: response.data.name,
               ...response.data.message
                  ? {
                     message: response.data.message
                  }
                  : {},
               at: new Date(Date.parse(response.data.at))
            },
         lastUpdatedAt: new Date()
      };
   };


   async #updateAnnouncementCache() {
      // don't update this cache
      const useAnnouncement = this.#fennecOptions.useAnnouncement ?? true;
      if (!useAnnouncement)
         return;

      // get announcement data
      const response = await this.#sendRequest(Methods.Get, Routes.Announcement);

      // no status
      this.#announcementCache = {
         announcement: response.status === HTTPStatusCodes.NotFound
            ? undefined
            : {
               message: response.data.message,
               at: new Date(Date.parse(response.data.at)),
               ...response.data.delete
                  ? {
                     delete: new Date(Date.parse(response.data.at))
                  }
                  : {}
            },
         lastUpdatedAt: new Date()
      };
   };


   async #updateAnnouncementUsersCache() {
      // don't update this cache
      const useAnnouncement = this.#fennecOptions.useAnnouncement ?? true;
      if (!useAnnouncement)
         return;

      // get announcement users data
      const response = await this.#sendRequest(Methods.Get, Routes.AnnouncementUsers);

      this.#announcementUsersCache = {
         users: response.data,
         lastUpdatedAt: new Date()
      };
   };


   async #updateOnlineStatus() {
      // don't update this cache
      const useOnlineStatus = this.#fennecOptions.useOnlineStatus ?? true;
      if (!useOnlineStatus)
         return;

      // update this app's online status
      await this.#sendRequest(Methods.Post,
         [
            Routes.UpdateOnlineStatus,
            `?process=${this.#fennecOptions.process ?? `main`}`,
            ...this.#fennecOptions.fennecProcess
               ? [ `&fennecProcess=${this.#fennecOptions.fennecProcess}` ]
               : []
         ]
            .join(``)
      );
   };


   #initialiseWebsocket() {
      const initialiseWebhook = () => {
         this.#websocket = new WebSocket(`${this.#fennecOptions.fennecWebsocket.baseUrl}?token=${encodeURIComponent(this.#fennecOptions.fennecWebsocket.authorisation)}`, { rejectUnauthorized: false });

         const setHeartbeat = async () => {
            if (this.#websocket.readyState === this.#websocket.CONNECTING) {
               await wait(250);
               return await setHeartbeat();
            };

            clearTimeout(this.#websocketHeartbeat);
            this.#websocketHeartbeat = setTimeout(
               () => {
                  this.#websocket.terminate();
                  throw new Error(`🚫 FennecClient websocket to fennec-websocket's heartbeat timer was ended and connection has been terminated`);
               },
               0.5 * 60 * 1000 // websocket server interval
                  +   1 * 3000 // latency
            );
         };

         this.#websocket.on(`open`, async () =>
            await setHeartbeat()
         );

         this.#websocket.on(`ping`, async () =>
            await setHeartbeat()
         );

         this.#websocket.on(`error`, error => {
            console.error(`🚫 error at FennecClient.#websocket`);
            throw error;
         });

         this.#websocket.on(`message`, rawData => {
            const data = JSON.parse(rawData);
            this.fennecWebsocket.emit(`data`, data);
         });

         this.#websocket.on(`close`, () => {
            clearTimeout(this.#websocketHeartbeat);
            this.#websocket = initialiseWebhook(); // reconnect to the websocket by reinitialising the variables
         });

         return this.#websocket;
      };

      this.#websocket = initialiseWebhook();
   };


   async initialise() {
      // client already initialised
      if (this.#initialised)
         throw new Error(`🚫 FennecClient.initialise() has already been run`);

      // methods to run
      const intervalFunction = async () => {
         await this.#updateBlacklistCache();
         await this.#updateApplicationStatusApplicationStatisticsStatusCache();
         await this.#updateAnnouncementCache();
         await this.#updateAnnouncementUsersCache();
         await this.#updateOnlineStatus();
      };

      // run methods first time
      await intervalFunction();

      // run methods every 15 minutes
      const fifteenMinutes = 15 * 60 * 1000;
      setIntervalAsync(intervalFunction, fifteenMinutes);

      // set up the websocket client to fennec-websocket
      if (this.#fennecOptions.fennecWebsocket)
         this.#initialiseWebsocket();

      // client initialised
      this.#initialised = true;
   };


   isConnected(id) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // #fennecWebsocket options were not specified
      if (!this.#fennecOptions.fennecWebsocket)
         throw this.#noFennecWebsocketArgs;

      // check if a client is connected
      return new Promise((resolve, reject) => {
         this.#websocket.once(`message`, raw => {
            const data = JSON.parse(raw);
            resolve(data?.connected);
         });

         this.#websocket.once(`error`, error => reject(error));

         const dataToSend = JSON.stringify({ id });
         this.#websocket.send(dataToSend);
      });
   };


   sendData(toId, data) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // #fennecWebsocket options were not specified
      if (!this.#fennecOptions.fennecWebsocket)
         throw this.#noFennecWebsocketArgs;

      // send data
      const dataToSend = JSON.stringify({ toId, data });
      this.#websocket.send(dataToSend);
   };


   listBlacklist() {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useBlacklist = this.#fennecOptions.useBlacklist ?? true;
      if (!useBlacklist)
         throw this.#notUsingBlacklistCacheError(`listBlacklist`);

      // return the blacklist cache
      const { blacklist } = this.#blacklistCache;
      return blacklist;
   };


   isOnBlacklist(userId) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useBlacklist = this.#fennecOptions.useBlacklist ?? true;
      if (!useBlacklist)
         throw this.#notUsingBlacklistCacheError(`isOnBlacklist`);

      // check if this userId is on the blacklist cache
      const { blacklist } = this.#blacklistCache;
      return blacklist.includes(userId);
   };


   async getUserBlacklistInfo(userId) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

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


   async addToBlacklist(userId, byUserId, at, reason, expiresAt) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useBlacklist = this.#fennecOptions.useBlacklist ?? true;
      if (!useBlacklist)
         throw this.#notUsingBlacklistCacheError(`addToBlacklist`);

      // reason too long
      if (reason.length > 1024)
         throw new Error(`🚫 reason argument for FennecClient.addToBlacklist() too long`);

      // reason is multiline
      if (/\r|\n/.test(reason))
         throw new Error(`🚫 reason argument for FennecClient.addToBlacklist() is multiline`);

      // request body
      const body = JSON.stringify({
         by: byUserId,
         at: at.getTime(),
         reason,
         delete: expiresAt?.getTime()
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

      // add to the blacklist cache
      this.#blacklistCache.blacklist.push(userId);
   };


   async removeFromBlacklist(userId) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useBlacklist = this.#fennecOptions.useBlacklist ?? true;
      if (!useBlacklist)
         throw this.#notUsingBlacklistCacheError(`removeFromBlacklist`);

      // remove from blacklist
      const response = await this.#sendRequest(Methods.Delete, Routes.BlacklistUser(userId));

      // can't use this endpoint
      if (response.status === HTTPStatusCodes.Forbidden)
         throw new Error(`🚫 insufficient permissions to use FennecClient.removeFromBlacklist()`);

      // other error
      else if (response.status === HTTPStatusCodes.InternalServerError)
         throw new Error(`🚫 error at FennecClient.removeFromBlacklist()\n\n${response.data}`);

      // remove from the blacklist cache
      this.#blacklistCache.blacklist = this.#blacklistCache.blacklist.filter(blacklistUserId => blacklistUserId !== userId);
   };


   async getGuildInvite() {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // get guild invite
      const guildInviteData = await this.#sendRequest(Methods.Get, Routes.GuildInvite);

      // return guild invite
      return guildInviteData.data?.[`guild-invite`];
   };


   async postLog(content, at) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // request body
      const body = JSON.stringify({
         content,
         at: at.getTime()
      });

      // send log
      await this.#sendRequest(Methods.Post, Routes.Log, body);
   };


   async postErrorLog(error, source, at, interactionId) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

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


   getApplicationStatusApplicationStatisticsStatus() {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useApplicationStatusApplicationStatisticsStatus = this.#fennecOptions.useApplicationStatusApplicationStatisticsStatus ?? true;
      if (!useApplicationStatusApplicationStatisticsStatus)
         throw this.#notUsingApplicationStatusApplicationStatisticsStatusCacheError(`getApplicationStatusApplicationStatisticsStatus`);

      // return application status data
      const { applicationStatusApplicationStatisticsStatus } = this.#applicationStatusApplicationStatisticsStatusCache;
      return applicationStatusApplicationStatisticsStatus;
   };


   async setApplicationStatusApplicationStatisticsStatus(id, at, name, message) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // message too long
      if (message && message.length > 4000)
         throw new Error(`🚫 message argument for FennecClient.setApplicationStatusApplicationStatisticsStatus() too long`);

      // request body
      const body = JSON.stringify({
         id,
         at: at.getTime(),
         ...message
            ? { message }
            : {},
         name
      });

      // set application status' application statistics' status
      const response = await this.#sendRequest(Methods.Post, Routes.ApplicationStatusApplicationStatisticsStatus, body);

      // can't use this endpoint
      if (response.status === HTTPStatusCodes.Forbidden)
         throw new Error(`🚫 insufficient permissions to use FennecClient.setApplicationStatusApplicationStatisticsStatus()`);

      // other error
      else if (response.status === HTTPStatusCodes.InternalServerError)
         throw new Error(`🚫 error at FennecClient.setApplicationStatusApplicationStatisticsStatus()\n\n${response.data}`);
   };


   getAnnouncement() {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useAnnouncement = this.#fennecOptions.useAnnouncement ?? true;
      if (!useAnnouncement)
         throw this.#notUsingAnnouncementCache(`getAnnouncement`);

      // return announcement data
      const { announcement } = this.#announcementCache;
      return announcement;
   };


   async setAnnouncement(id, at, message, expiresAt) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // message too long
      if (message.length > 4000)
         throw new Error(`🚫 message argument for FennecClient.setApplicationStatusApplicationStatisticsStatus() too long`);

      // request body
      const body = JSON.stringify({
         id,
         at: at.getTime(),
         message,
         delete: expiresAt?.getTime()
      });

      // set application status' application statistics' status
      const response = await this.#sendRequest(Methods.Post, Routes.Announcement, body);

      // can't use this endpoint
      if (response.status === HTTPStatusCodes.Forbidden)
         throw new Error(`🚫 insufficient permissions to use FennecClient.setAnnouncement()`);

      // other error
      else if (response.status === HTTPStatusCodes.InternalServerError)
         throw new Error(`🚫 error at FennecClient.setAnnouncement()\n\n${response.data}`);
   };


   async deleteAnnouncement(id) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // set application status' application statistics' status
      const response = await this.#sendRequest(Methods.Delete, `${Routes.Announcement}?id=${id}`);

      // can't use this endpoint
      if (response.status === HTTPStatusCodes.Forbidden)
         throw new Error(`🚫 insufficient permissions to use FennecClient.deleteAnnouncement()`);

      else if (response.status === HTTPStatusCodes.NotFound)
         return null;

      // other error
      else if (response.status === HTTPStatusCodes.InternalServerError)
         throw new Error(`🚫 error at FennecClient.deleteAnnouncement()\n\n${response.data}`);
   };


   async setSeenAnnouncement(userId) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // no announcement set: don't set anything
      const response = await this.#sendRequest(Methods.Get, Routes.Announcement);
      if (response.status === HTTPStatusCodes.NotFound)
         return;

      // set that this user has seen this application's announcement
      await this.#sendRequest(Methods.Post, Routes.AnnouncementUser(userId));
   };


   hasSeenAnnouncement(userId) {
      // client isn't initialised
      if (!this.#initialised)
         return console.error(this.#notInitialisedError);

      // client isn't updating this cache
      const useAnnouncement = this.#fennecOptions.useAnnouncement ?? true;
      if (!useAnnouncement)
         throw this.#notUsingAnnouncementCache(`hasSeenAnnouncement`);

      // get announcement users
      const { users } = this.#announcementUsersCache;
      return users.includes(userId);
   };


};