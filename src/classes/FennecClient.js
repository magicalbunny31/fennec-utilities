const { EventEmitter } = require("node:events");
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


   #fennecWorker;
   #process;
   #fennecCloudRun;
   #initialised = false;
   #notInitialisedError = new Error(`🚫 class FennecClient method #initialise() not run yet`);
   #noFennecCloudRunArgs = new Error(`🚫 class FennecClient fennecCloudRun arguments are required to use this method`);
   #blacklistCache;
   #applicationStatusApplicationStatisticsStatusCache;
   #announcementCache;
   #announcementUsersCache;
   #websocket;
   #websocketHeartbeat;

   cloudRun = new EventEmitter();


   constructor(fennecWorker, process = `main`, fennecCloudRun) {
      // missing required arguments
      if (!fennecWorker)
         throw new Error(`🚫 missing required argument \`fennecWorker\` on class FennecClient instantiation`);

      // set private attributes
      this.#fennecWorker   = fennecWorker;
      this.#process        = process;
      this.#fennecCloudRun = fennecCloudRun;
   };


   async #sendRequest(method, route, body) {
      // send response
      const response = await fetch(`${this.#fennecWorker.baseUrl}${route}`, {
         method,
         headers: {
            Authorization: this.#fennecWorker.authorisation,
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
      const response = await this.#sendRequest(Methods.Get, Routes.Blacklist);

      // update the cache
      this.#blacklistCache = {
         blacklist: response.data,
         lastUpdatedAt: new Date()
      };
   };


   async #updateApplicationStatusApplicationStatisticsStatusCache() {
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
      // get announcement users data
      const response = await this.#sendRequest(Methods.Get, Routes.AnnouncementUsers);

      this.#announcementUsersCache = {
         users: response.data,
         lastUpdatedAt: new Date()
      };
   };


   async #updateOnlineStatus() {
      await this.#sendRequest(Methods.Post, `${Routes.UpdateOnlineStatus}?process=${this.#process}`);
   };


   #initialiseWebsocket() {
      const initialiseWebhook = () => {
         this.#websocket = new WebSocket(`${this.#fennecCloudRun.baseUrl}?token=${encodeURIComponent(this.#fennecCloudRun.authorisation)}`);

         this.#websocket.on(`open`, () => {
            clearTimeout(this.#websocketHeartbeat);
            this.#websocketHeartbeat = setTimeout(
               () => {
                  this.#websocket.terminate();
                  throw new Error(`🚫 class FennecClient websocket to fennec-cloud-run's heartbeat timer was ended and connection has been terminated`);
               },
               0.5 * 60 * 1000 // websocket server interval
                  +   1 * 1000 // latency
            );
         });

         this.#websocket.on(`ping`, () => {
            clearTimeout(this.#websocketHeartbeat);
            this.#websocketHeartbeat = setTimeout(
               () => {
                  this.#websocket.terminate();
                  throw new Error(`🚫 class FennecClient websocket to fennec-cloud-run's heartbeat timer was ended and connection has been terminated`);
               },
               0.5 * 60 * 1000 // websocket server interval
                  +   1 * 1000 // latency
            );
         });

         this.#websocket.on(`error`, error => {
            console.error(`🚫 error at FennecClient.#websocket`);
            throw error;
         });

         this.#websocket.on(`message`, rawData => {
            const data = JSON.parse(rawData);
            this.cloudRun.emit(`data`, data);
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
         throw new Error(`🚫 class FennecClient method #initialise() has already been run`);

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

      // set up the websocket client to fennec-cloud-run
      if (this.#fennecCloudRun)
         this.#initialiseWebsocket();

      // client initialised
      this.#initialised = true;
   };


   isConnected(id) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // #fennecCloudRun options were not specified
      if (!this.#fennecCloudRun)
         throw this.#noFennecCloudRunArgs;

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
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // #fennecCloudRun options were not specified
      if (!this.#fennecCloudRun)
         throw this.#noFennecCloudRunArgs;

      // send data
      const dataToSend = JSON.stringify({ toId, data });
      this.#websocket.send(dataToSend);
   };


   listBlacklist() {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // return the blacklist cache
      const { blacklist } = this.#blacklistCache;
      return blacklist;
   };


   isOnBlacklist(userId) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // check if this userId is on the blacklist cache
      const { blacklist } = this.#blacklistCache;
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


   async addToBlacklist(userId, byUserId, at, reason, expiresAt) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

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
         throw new Error(`🚫 error at FennecClient.removeFromBlacklist()\n\n${response.data}`);

      // remove from the blacklist cache
      this.#blacklistCache.blacklist = this.#blacklistCache.blacklist.filter(blacklistUserId => blacklistUserId !== userId);
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


   getApplicationStatusApplicationStatisticsStatus() {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // return application status data
      const { applicationStatusApplicationStatisticsStatus } = this.#applicationStatusApplicationStatisticsStatusCache;
      return applicationStatusApplicationStatisticsStatus;
   };


   async setApplicationStatusApplicationStatisticsStatus(id, at, name, message) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

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
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // return announcement data
      const { announcement } = this.#announcementCache;
      return announcement;
   };


   async setAnnouncement(id, at, message, expiresAt) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

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
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

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
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // no announcement set: don't set anything
      const response = await this.#sendRequest(Methods.Get, Routes.Announcement);
      if (response.status === HTTPStatusCodes.NotFound)
         return;

      // set that this user has seen this application's announcement
      await this.#sendRequest(Methods.Post, Routes.AnnouncementUser(userId));
   };


   hasSeenAnnouncement(userId) {
      // client not initialised
      if (!this.#initialised)
         throw this.#notInitialisedError;

      // get announcement users
      const { users } = this.#announcementUsersCache;
      return users.includes(userId);
   };


};