import type { CreateGameBody } from '../api/types'
import imgDeveloper from '../assets/professions/developer.png'
import imgDoctor from '../assets/professions/doctor.png'
import imgEngineer from '../assets/professions/engineer.png'
import imgFarmer from '../assets/professions/farmer.png'
import imgFinancier from '../assets/professions/financier.png'
import imgStreetCleaner from '../assets/professions/streen_cleaner.png'
import imgDeveloperAvatar from '../assets/professions/developer_avatar.png'
import imgDoctorAvatar from '../assets/professions/doctor_avatar.png'
import imgEngineerAvatar from '../assets/professions/engineer_avatar.png'
import imgFarmerAvatar from '../assets/professions/farmer_avatar.png'
import imgFinancierAvatar from '../assets/professions/financier_avatar.png'
import imgStreetCleanerAvatar from '../assets/professions/street_cleaner_avatar.png'

export const PROFESSION_IMAGES: Record<CreateGameBody['profession'], string> = {
  STREET_CLEANER: imgStreetCleaner,
  FARMER: imgFarmer,
  ENGINEER: imgEngineer,
  DEVELOPER: imgDeveloper,
  FINANCIER: imgFinancier,
  DOCTOR: imgDoctor,
}

export const PROFESSION_AVATARS: Record<CreateGameBody['profession'], string> = {
  STREET_CLEANER: imgStreetCleanerAvatar,
  FARMER: imgFarmerAvatar,
  ENGINEER: imgEngineerAvatar,
  DEVELOPER: imgDeveloperAvatar,
  FINANCIER: imgFinancierAvatar,
  DOCTOR: imgDoctorAvatar,
}

export function getProfessionImage(
  profession?: string,
): string | undefined {
  if (!profession) return undefined
  return PROFESSION_IMAGES[profession as CreateGameBody['profession']]
}

export function getProfessionAvatar(
  profession: CreateGameBody['profession'],
): string {
  return PROFESSION_AVATARS[profession]
}
