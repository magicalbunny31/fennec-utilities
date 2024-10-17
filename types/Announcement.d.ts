export type Announcement = {
   /**
    * 📰 this announcement
    */
   message: string;

   /**
    * 🗓️ `Date` of when this announcement was created
    */
   at: Date;

   /**
    * 🗓️ `Date` of when this announcement expires
    *
    * ❓ this field will be omitted if this announcement doesn't expire
    */
   delete?: Date;
};