export type TimeLogSource = "door" | "web" | "mobile";

export interface ITimelog {
  _id: string
  rep: {
    _id: string
    name: string
    phone: string
  }
  checkinTime: string
  checkoutTime: string | null
  source?: TimeLogSource   // where the clock event originated
  createdAt: string
  updatedAt: string
}

export interface ITimelogLog {
  date: string
  checkinTime: string
  checkoutTime: string | null
  hoursWorked: number
  minutesWorked: number
  totalMinutes: number
  status?: string
}

export interface ITimelogSummary {
  repId: string
  repName: string
  repEmail?: string
  repPhone?: string
  repType?: string
  payType?: "hourly" | "salary"
  hourlyRate?: number | null
  semiMonthlyAmount?: number | null
  totalHours: number
  totalMinutes: number
  totalMinutesWorked: number
  formattedTotalTime: string
  daysWorked: number
  logs: ITimelogLog[]
}

export interface ITimelogSummaryResponse {
  message: string
  dateRange: {
    startDate: string
    endDate: string
  }
  totalReps: number
  data: ITimelogSummary[]
}
