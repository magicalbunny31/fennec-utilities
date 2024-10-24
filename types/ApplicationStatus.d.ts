export type ApplicationStatisticsStatusName = `online` | `offline`;


export type ApplicationStatisticsStatus = {
   /**
    * 🗓️ `Date` of when this `ApplicationStatus` was set
    */
   at: Date;

   /**
    * 📄 reason why this `ApplicationStatus` was set
    *
    * ❓ this field will be omitted if this `ApplicationStatus`'s is set to "online"
    */
   message?: string;

   /**
    * 🏷️ type of `ApplicationStatus`
    */
   name: ApplicationStatisticsStatusName;   
};