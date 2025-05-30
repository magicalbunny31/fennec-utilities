export type AnnouncementCache = {
   announcement: Announcement;
   lastUpdatedAt: Date;
};


type AnnouncementUsers = string[];

export type AnnouncementUsersCache = {
   users: AnnouncementUsers
   lastUpdatedAt: Date;
};


export type Announcement = {
   /**
    * 🗓️ `Date` of when this announcement was created
    */
   at: Date;

   /**
    * 📰 this announcement
    */
   message: string;

   /**
    * 🗓️ `Date` of when this announcement expires
    *
    * ❓ this field will be omitted if this announcement doesn't expire
    */
   delete?: Date;
};