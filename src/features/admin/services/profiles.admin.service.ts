import {
  getAdminProfiles,
  getAdminProfileById,
  updateProfile,
} from '../repository/profiles.admin.repository'
import type { AdminProfile, UpdateProfileData } from '../types'

export const adminProfilesService = {
  async list(search?: string): Promise<AdminProfile[]> {
    return getAdminProfiles(search)
  },

  async getById(entrepreneurId: string): Promise<AdminProfile | null> {
    return getAdminProfileById(entrepreneurId)
  },

  async update(entrepreneurId: string, data: UpdateProfileData): Promise<void> {
    return updateProfile(entrepreneurId, data)
  },
}
