export type ApplicationFormStep1 = {
  cedula: string
  full_name: string
  email: string
  phone: string
  fb_profile_url: string
}

export type ApplicationFormStep2 = {
  business_name: string
  description: string
  category: string
  business_phone: string
  instagram_handle?: string
  website_url?: string
  other_socials?: string
  offers_discount: boolean
  discount_details?: string
  directory_image: File | null
}

export type ApplicationFormStep3 = {
  product_id: string
  receipt: File | null
  post_screenshot: File | null
  consent_accepted: boolean
}

export type WompiFormData = {
  wompi_reference: string
  wompi_status: string
  payment_completed_at: string
}

export type ApplicationFormData = ApplicationFormStep1 & ApplicationFormStep2 & ApplicationFormStep3

export type ProductOption = {
  id: string
  name: string
  price_cop: number
  duration_days: number | null
}

export type SubmissionResult = {
  success: boolean
  message: string
  applicationId?: string
  checkoutUrl?: string
  paymentTransactionId?: string
}
