type Blacklist = string[];


export type BlacklistCache = {
   blacklist: Blacklist;
   lastUpdatedAt: Date;
};


export type BlacklistEntry = {
   /**
    * 👤 the user id of the person who created this `BlacklistEntry`
    *
    * ❓ this field will be `undefined` if the `userId` belonging to this `BlacklistEntry`
   */
   by: string?;

   /**
    * ⌚ unix timestamp (in milliseconds) of when this `BlacklistEntry` was created
    *
    * ❓ this field will be `undefined` if the `userId` belonging to this `BlacklistEntry`
   */
   at: number?;

   /**
    * 🏷️ the reason why this `BlacklistEntry` was created
    *
    * ❓ this field will be `undefined` if the `userId` belonging to this `BlacklistEntry`
   */
   reason: string?;
};