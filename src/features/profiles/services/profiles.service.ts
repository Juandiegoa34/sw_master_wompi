import { getProfiles, getProfileBySlug } from '../repository/profiles.repository'
import type { DirectoryProfile, ProfileFilters } from '../types'

export const profilesService = {
  async findAll(filters?: ProfileFilters): Promise<DirectoryProfile[]> {
    return getProfiles(filters)
  },

  async getBySlug(slug: string): Promise<DirectoryProfile | null> {
    return getProfileBySlug(slug)
  },
}
