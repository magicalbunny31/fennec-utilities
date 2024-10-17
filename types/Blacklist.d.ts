type Blacklist = string[];


export type BlacklistCache = {
   blacklist: Blacklist;
   lastUpdatedAt: Date;
};


export type BlacklistEntry = {
   /**
    * 👤 the user id of the person who created this `BlacklistEntry`
   */
   by: string;

   /**
    * 🗓️ `Date` of when this `BlacklistEntry` was created
   */
   at: Date;

   /**
    * 🏷️ the reason why this `BlacklistEntry` was created
   */
   reason: string;

   /**
    * 🗓️ `Date` of when this `BlacklistEntry` will expire
    *
    * ❓ this field will be omitted if this `BlacklistEntry`'s doesn't expire
   */
   delete?: Date;
};