export type ContactClickType = 'whatsapp' | 'instagram' | 'website'

export type TrackingEvent = {
  profileId: string
  type: ContactClickType
}

export type ProfileStats = {
  profileId: string
  views: number
  clicks: {
    whatsapp: number
    instagram: number
    website: number
    total: number
  }
}

export type TimeSeriesPoint = {
  date: string   // formato 'YYYY-MM-DD'
  views: number
  clicks: number
}

export type DirectoryAverages = {
  avgViews: number
  avgClicks: number
}

export type FullStats = ProfileStats & {
  businessName: string
  timeSeries: TimeSeriesPoint[]
  averages: DirectoryAverages
}
