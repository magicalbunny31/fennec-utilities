type ApplicationStatisticsStatusName = `online` | `offline`;


export type ApplicationStatisticsStatus = {
   name?:    ApplicationStatisticsStatusName;
   message?: string;
   at?:      Date;
};