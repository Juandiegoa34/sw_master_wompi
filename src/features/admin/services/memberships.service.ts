import { getMembershipAlerts, toggleMembership } from '../repository/memberships.repository'
import type { MembershipAlert } from '../types'

export const membershipsService = {
  async getAlerts(): Promise<MembershipAlert[]> {
    return getMembershipAlerts()
  },

  async toggle(entrepreneurId: string, newStatus: 'active' | 'inactive'): Promise<void> {
    return toggleMembership(entrepreneurId, newStatus)
  },
}
