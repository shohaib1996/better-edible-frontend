export interface ITimelog {
  _id: string
  rep: {
    _id: string
    name: string
    phone: string
  }
  checkinTime: string
  checkoutTime: string | null
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
