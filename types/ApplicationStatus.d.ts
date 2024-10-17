type ApplicationStatisticsStatusName = `online` | `offline`;


export type ApplicationStatisticsStatus = {
   /**
    * 🏷️ type of `ApplicationStatus`
    */
   name: ApplicationStatisticsStatusName;

   /**
    * 📄 reason why this `ApplicationStatus` was set
    *
    * ❓ this field will be omitted if this `ApplicationStatus`'s is set to "online"
    */
   message?: string;

   /**
    * 🗓️ `Date` of when this `ApplicationStatus` was set
    */
   at: Date;
};