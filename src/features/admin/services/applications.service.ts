import {
  listApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
} from '../repository/applications.repository'
import { activateMembership } from '../repository/memberships.repository'
import { notifyEntrepreneurApproved, notifyEntrepreneurRejected } from '@src/shared/lib/email'
import type { AdminApplication } from '../types'

export const applicationsService = {
  async list(status?: 'pendiente' | 'aprobado' | 'rechazado'): Promise<AdminApplication[]> {
    return listApplications(status)
  },

  async getById(id: string): Promise<AdminApplication | null> {
    return getApplicationById(id)
  },

  async approve(
    applicationId: string,
    entrepreneurId: string,
    durationDays: number,
    entrepreneurEmail: string,
    entrepreneurName: string,
    businessName: string,
    statsToken?: string
  ): Promise<void> {
    await approveApplication(applicationId, entrepreneurId, durationDays)
    await activateMembership(entrepreneurId, applicationId, durationDays)
    try {
      await notifyEntrepreneurApproved({
        to: entrepreneurEmail,
        entrepreneurName,
        businessName,
        statsToken,
      })
    } catch {
      // email fails silently
    }
  },

  async reject(
    applicationId: string,
    notes?: string,
    entrepreneurEmail?: string,
    entrepreneurName?: string
  ): Promise<void> {
    await rejectApplication(applicationId, notes)
    if (entrepreneurEmail && entrepreneurName) {
      try {
        await notifyEntrepreneurRejected({
          to: entrepreneurEmail,
          entrepreneurName,
          notes,
        })
      } catch {
        // email fails silently
      }
    }
  },
}
