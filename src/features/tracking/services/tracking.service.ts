import {
  insertView,
  insertClick,
  getStatsByToken,
  getTimeSeriesStats,
  getDirectoryAverages,
} from '../repository/tracking.repository'
import type { ContactClickType, ProfileStats, FullStats } from '../types'

export const trackingService = {
  async recordView(profileId: string): Promise<void> {
    return insertView(profileId)
  },

  async recordClick(profileId: string, type: ContactClickType): Promise<void> {
    return insertClick(profileId, type)
  },

  async getStats(token: string): Promise<ProfileStats | null> {
    return getStatsByToken(token)
  },

  async getFullStats(token: string): Promise<FullStats | null> {
    const base = await getStatsByToken(token)
    if (!base) return null

    const [timeSeries, averages] = await Promise.all([
      getTimeSeriesStats(base.profileId),
      getDirectoryAverages(),
    ])

    return { ...base, timeSeries, averages }
  },
}
