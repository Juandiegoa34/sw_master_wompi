'use client'

import { useEffect, useState } from 'react'
import { buildWompiCheckoutUrl } from '@src/features/payments/wompi.service'
import PhoneInput from '@/components/ui/PhoneInput'
import { CATEGORIES } from '@src/shared/utils/categories'
import type {
  ApplicationFormStep1,
  ApplicationFormStep2,
  ProductOption,
} from '@src/features/enrollment/types'
import { DescriptionReviewPanel } from '@src/features/profile-editorial-review/components/DescriptionReviewPanel'
import type { AcceptedReview } from '@src/features/profile-editorial-review/components/DescriptionReviewPanel'
import type { ReviewResult } from '@src/features/profile-editorial-review/types'

// ─── Error shape types ────────────────────────────────────────────────────────

type Step1Errors = Partial<Record<keyof ApplicationFormStep1, string>>

type Step2Fields = keyof Omit<ApplicationFormStep2, 'directory_image'> | 'discount_details'
type Step2Errors = Partial<Record<Step2Fields, string>>

type Step3Errors = {
  product_id?: string
  receipt?: string
  consent_accepted?: string
}

// ─── Step 2 local state ───────────────────────────────────────────────────────

type Step2State = {
  business_name: string
  description: string
  category: string
  business_phone: string
  instagram_handle: string
  website_url: string
  other_socials: string
  offers_discount: boolean
  discount_details: string
}

// ─── Step 3 local state ───────────────────────────────────────────────────────

type Step3State = {
  product_id: string
  receipt: File | null
  post_screenshot: File | null
  consent_accepted: boolean
}

// ─── File validation constants ───────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function isSinglePublicationProduct(product: ProductOption | null): boolean {
  const normalizedName =
    product?.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() ?? ''

  return normalizedName.includes('unica publicacion')
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const baseInput =
  'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all bg-sw-paper'

function inputClass(hasError: boolean): string {
  return `${baseInput} ${
    hasError
      ? 'border-sw-burgundy ring-0 focus:ring-sw-rose-pale'
      : 'border-[--sw-line-strong] focus:ring-sw-rose-pale focus:border-[--accent]'
  }`
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-wide uppercase text-[--fg-2]">{label}</label>
      {hint && <p className="text-xs text-[--fg-3] -mt-1">{hint}</p>}
      {children}
      {error && <p className="text-xs text-sw-burgundy mt-0.5">{error}</p>}
    </div>
  )
}

// ─── Progress indicator ───────────────────────────────────────────────────────

const STEP_LABELS = ['Datos personales', 'Tu negocio', 'Plan y envío']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-10 gap-0">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isDone = step < current
        const isActive = step === current

        return (
          <div key={step} className="flex items-center">
            {i > 0 && (
              <div
                className="w-10 sm:w-16 h-px transition-colors duration-300"
                style={{ background: step <= current ? 'var(--accent)' : 'var(--sw-line-strong)' }}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300"
                style={
                  isDone || isActive
                    ? {
                        background: 'var(--accent)',
                        borderColor: 'var(--accent)',
                        color: 'var(--sw-cream)',
                        boxShadow: isActive ? '0 4px 12px rgba(130,22,65,0.25)' : undefined,
                      }
                    : {
                        background: 'var(--sw-paper)',
                        borderColor: 'var(--sw-line-strong)',
                        color: 'var(--fg-3)',
                      }
                }
              >
                {isDone ? '✓' : step}
              </div>
              <span
                className="text-xs hidden sm:block font-medium tracking-wide"
                style={{ color: isActive ? 'var(--accent)' : 'var(--fg-3)' }}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Datos personales ────────────────────────────────────────────────

function Step1Form({
  data,
  errors,
  onChange,
}: {
  data: ApplicationFormStep1
  errors: Step1Errors
  onChange: (field: keyof ApplicationFormStep1, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="mb-6">
        <p className="sw-eyebrow mb-1">Paso 1 de 3</p>
        <h2 className="sw-display sw-h3 text-[--fg]">Datos personales</h2>
      </div>

      <Field label="Cédula" error={errors.cedula}>
        <input
          type="text"
          value={data.cedula}
          onChange={(e) => onChange('cedula', e.target.value)}
          className={inputClass(!!errors.cedula)}
          placeholder="1234567890"
          inputMode="numeric"
        />
      </Field>

      <Field label="Nombre completo" error={errors.full_name}>
        <input
          type="text"
          value={data.full_name}
          onChange={(e) => onChange('full_name', e.target.value)}
          className={inputClass(!!errors.full_name)}
          placeholder="Tu nombre completo"
        />
      </Field>

      <Field label="Correo electrónico" error={errors.email}>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          className={inputClass(!!errors.email)}
          placeholder="tu@email.com"
        />
      </Field>

      <Field label="Teléfono personal" error={errors.phone}>
        <PhoneInput
          id="phone"
          value={data.phone}
          onChange={(val) => onChange('phone', val)}
          error={!!errors.phone}
        />
      </Field>

      <Field label="URL de tu perfil de Facebook" error={errors.fb_profile_url}>
        <input
          type="url"
          value={data.fb_profile_url}
          onChange={(e) => onChange('fb_profile_url', e.target.value)}
          className={inputClass(!!errors.fb_profile_url)}
          placeholder="https://facebook.com/tu.perfil"
        />
      </Field>
    </div>
  )
}

// ─── Step 2 — Datos del negocio ───────────────────────────────────────────────

function Step2Form({
  data,
  errors,
  onChange,
  acceptedReview,
  onReviewResult,
  onReviewAccepted,
}: {
  data: Step2State
  errors: Step2Errors
  onChange: (field: keyof Step2State, value: string | boolean) => void
  acceptedReview: AcceptedReview | null
  onReviewResult: (result: ReviewResult) => void
  onReviewAccepted: (result: AcceptedReview) => void
}) {
  const descLen = data.description.length
  const descOver = descLen > 300

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <p className="sw-eyebrow mb-1">Paso 2 de 3</p>
        <h2 className="sw-display sw-h3 text-[--fg]">Tu negocio</h2>
      </div>

      <Field label="Nombre del negocio" error={errors.business_name}>
        <input
          type="text"
          value={data.business_name}
          onChange={(e) => onChange('business_name', e.target.value)}
          className={inputClass(!!errors.business_name)}
          placeholder="Mi Emprendimiento"
        />
      </Field>

      <Field label="Categoría" error={errors.category}>
        <select
          value={data.category}
          onChange={(e) => onChange('category', e.target.value)}
          className={inputClass(!!errors.category)}
        >
          <option value="">Selecciona una categoría</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descripción" error={errors.description}>
        <div className="relative">
          <textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={4}
            className={`${inputClass(!!errors.description || descOver)} resize-none`}
            placeholder="Cuéntanos qué ofreces..."
          />
          <span
            className={`absolute bottom-2 right-3 text-xs ${
              descOver ? 'text-sw-burgundy font-medium' : 'text-[--fg-3]'
            }`}
          >
            {descLen} / 300
          </span>
        </div>
        {acceptedReview && (
          <p className="text-xs text-[--accent] mt-1">
            Texto revisado con IA aplicado. Puedes seguir editándolo.
          </p>
        )}
        <DescriptionReviewPanel
          description={data.description}
          source="user_form"
          onResult={onReviewResult}
          onAccept={onReviewAccepted}
        />
      </Field>

      <Field
        label="WhatsApp del negocio"
        error={errors.business_phone}
      >
        <PhoneInput
          id="business_phone"
          value={data.business_phone}
          onChange={(val) => onChange('business_phone', val)}
          placeholder="300 123 4567"
          error={!!errors.business_phone}
        />
      </Field>

      <Field label="Instagram (opcional)" error={errors.instagram_handle}>
        <input
          type="text"
          value={data.instagram_handle}
          onChange={(e) => onChange('instagram_handle', e.target.value)}
          className={inputClass(!!errors.instagram_handle)}
          placeholder="@mi.negocio"
        />
      </Field>

      <Field label="Sitio web (opcional)" error={errors.website_url}>
        <input
          type="url"
          value={data.website_url}
          onChange={(e) => onChange('website_url', e.target.value)}
          className={inputClass(!!errors.website_url)}
          placeholder="https://minegocio.com"
        />
      </Field>

      <Field label="Otras redes (opcional)" error={errors.other_socials}>
        <input
          type="text"
          value={data.other_socials}
          onChange={(e) => onChange('other_socials', e.target.value)}
          className={inputClass(!!errors.other_socials)}
          placeholder="TikTok, Twitter, etc."
        />
      </Field>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold tracking-wide uppercase text-[--fg-2]">
          ¿Ofreces descuento especial a miembras SW?
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange('offers_discount', true)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all duration-200"
            style={
              data.offers_discount
                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--sw-cream)' }
                : { background: 'var(--sw-paper)', borderColor: 'var(--sw-line-strong)', color: 'var(--fg-2)' }
            }
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange('offers_discount', false)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all duration-200"
            style={
              !data.offers_discount
                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--sw-cream)' }
                : { background: 'var(--sw-paper)', borderColor: 'var(--sw-line-strong)', color: 'var(--fg-2)' }
            }
          >
            No
          </button>
        </div>
      </div>

      {data.offers_discount && (
        <Field label="Detalle del descuento" error={errors.discount_details}>
          <input
            type="text"
            value={data.discount_details}
            onChange={(e) => onChange('discount_details', e.target.value)}
            className={inputClass(!!errors.discount_details)}
            placeholder="Ej: 10% en primera compra para miembras SW"
          />
        </Field>
      )}
    </div>
  )
}

// ─── Step 3 — Plan y pago ─────────────────────────────────────────────────────

function Step3Form({
  data,
  errors,
  products,
  productsLoading,
  productsError,
  selectedProduct,
  onChange,
}: {
  data: Step3State
  errors: Step3Errors
  products: ProductOption[]
  productsLoading: boolean
  productsError: string | null
  selectedProduct: ProductOption | null
  onChange: (field: keyof Step3State, value: string | File | null | boolean) => void
}) {
  const isPaid = selectedProduct !== null && selectedProduct.price_cop > 0
  const showPostScreenshot = isSinglePublicationProduct(selectedProduct)

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="sw-eyebrow mb-1">Paso 3 de 3</p>
        <h2 className="sw-display sw-h3 text-[--fg]">Plan y envío</h2>
      </div>

      {/* Plan selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold tracking-wide uppercase text-[--fg-2]">
          Plan de membresía
        </label>

        {productsLoading && (
          <p className="text-sm text-[--fg-3]">Cargando planes disponibles…</p>
        )}

        {productsError && (
          <p className="text-sm text-sw-burgundy">{productsError}</p>
        )}

        {!productsLoading && !productsError && products.length === 0 && (
          <p className="text-sm text-[--fg-3]">No hay planes disponibles en este momento.</p>
        )}

        {!productsLoading && !productsError && products.length > 0 && (
          <div className="flex flex-col gap-2">
            {products.map((product) => {
              const isSelected = data.product_id === product.id
              const priceLabel =
                product.price_cop === 0
                  ? 'Gratuito'
                  : `$${product.price_cop.toLocaleString('es-CO')} COP`
              const durationLabel =
                product.duration_days !== null ? ` · ${product.duration_days} días` : ''

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onChange('product_id', product.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-[--accent] bg-sw-blush-mist'
                      : 'border-[--sw-line] bg-sw-paper hover:border-[--accent]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[--fg]">{product.name}</span>
                    <span
                      className={`text-sm font-semibold ${
                        product.price_cop === 0 ? 'text-[--accent]' : 'text-[--fg]'
                      }`}
                    >
                      {priceLabel}
                      <span className="font-normal text-[--fg-3]">{durationLabel}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {errors.product_id && (
          <p className="text-xs text-sw-burgundy">{errors.product_id}</p>
        )}
      </div>

      {/* Wompi info — solo para planes de pago */}
      {isPaid && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-[--fg-2] border"
          style={{
            background: 'var(--sw-blush-mist)',
            borderColor: 'var(--sw-rose-pale)',
          }}
        >
          Al continuar serás redirigida a la pasarela de pagos Wompi para completar tu pago de forma segura.
        </div>
      )}

      {/* Comprobante manual — solo para planes gratuitos o sin precio */}
      {!isPaid && (
        <Field
          label="Comprobante de pago (opcional)"
          error={errors.receipt}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => onChange('receipt', e.target.files?.[0] ?? null)}
            className="w-full text-sm text-[--fg-2] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sw-blush-mist file:text-[--accent] hover:file:bg-sw-rose-pale cursor-pointer"
          />
          {data.receipt && (
            <p className="text-xs text-[--fg-3] mt-1">Archivo seleccionado: {data.receipt.name}</p>
          )}
        </Field>
      )}

      {/* Post screenshot */}
      {showPostScreenshot && (
        <Field label="Captura de tu publicación en el grupo SW (opcional)">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onChange('post_screenshot', e.target.files?.[0] ?? null)}
            className="w-full text-sm text-[--fg-2] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sw-blush-mist file:text-[--accent] hover:file:bg-sw-rose-pale cursor-pointer"
          />
          {data.post_screenshot && (
            <p className="text-xs text-[--fg-3] mt-1">
              Archivo seleccionado: {data.post_screenshot.name}
            </p>
          )}
        </Field>
      )}

      {/* Consent checkbox */}
      <div className="flex flex-col gap-1">
        <label
          className={`flex items-start gap-3 cursor-pointer group ${
            errors.consent_accepted ? 'text-sw-burgundy' : 'text-[--fg-2]'
          }`}
        >
          <input
            type="checkbox"
            checked={data.consent_accepted}
            onChange={(e) => onChange('consent_accepted', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded shrink-0 accent-[--accent]"
          />
          <span className="text-sm leading-snug">
            Acepto los términos de uso y autorizo a SW Mujeres a publicar mi información en el
            directorio.
          </span>
        </label>
        {errors.consent_accepted && (
          <p className="text-xs text-sw-burgundy ml-7">{errors.consent_accepted}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InscripcionPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Step 1
  const [step1, setStep1] = useState<ApplicationFormStep1>({
    cedula: '',
    full_name: '',
    email: '',
    phone: '',
    fb_profile_url: '',
  })
  const [errors1, setErrors1] = useState<Step1Errors>({})

  // Step 2
  const [step2, setStep2] = useState<Step2State>({
    business_name: '',
    description: '',
    category: '',
    business_phone: '',
    instagram_handle: '',
    website_url: '',
    other_socials: '',
    offers_discount: false,
    discount_details: '',
  })
  const [errors2, setErrors2] = useState<Step2Errors>({})

  // Step 3
  const [step3, setStep3] = useState<Step3State>({
    product_id: '',
    receipt: null,
    post_screenshot: null,
    consent_accepted: false,
  })
  const [errors3, setErrors3] = useState<Step3Errors>({})

  // Editorial review state — used in Task 5B for submission
  const [acceptedReview, setAcceptedReview] = useState<AcceptedReview | null>(null)
  const [latestReviewResult, setLatestReviewResult] = useState<ReviewResult | null>(null)

  // Products
  const [products, setProducts] = useState<ProductOption[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProducts() {
      setProductsLoading(true)
      setProductsError(null)

      try {
        const res = await fetch('/api/membresias', { method: 'GET' })
        const json = (await res.json()) as {
          success: boolean
          data?: ProductOption[]
          message?: string
        }

        if (!res.ok || !json.success) {
          throw new Error(json.message ?? 'No se pudieron cargar los planes.')
        }

        const opts = json.data ?? []
        setProducts(opts)

        if (opts.length === 1) {
          setStep3((prev) => ({ ...prev, product_id: opts[0].id }))
        }
      } catch {
        setProductsError('No se pudieron cargar los planes disponibles. Recarga la página.')
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [])

  const selectedProduct = products.find((p) => p.id === step3.product_id) ?? null

  // ─── Editorial review handlers ──────────────────────────────────────────────

  function handleReviewResult(result: ReviewResult) {
    setLatestReviewResult(result)
  }

  function handleReviewAccepted(result: AcceptedReview) {
    setAcceptedReview(result)
    setLatestReviewResult({
      reviewId: result.reviewId,
      suggestedText: result.acceptedText,
      seoTags: result.seoTags,
      searchKeywords: result.searchKeywords,
      seoDescription: result.seoDescription,
      aiSummary: result.aiSummary,
      editorialStatus: result.editorialStatus,
    })
    setStep2((prev) => ({ ...prev, description: result.acceptedText }))
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const errs: Step1Errors = {}

    const cedula = step1.cedula.trim()
    if (!cedula) {
      errs.cedula = 'El número de cédula es obligatorio.'
    } else if (!/^\d{6,12}$/.test(cedula)) {
      errs.cedula = 'La cédula debe tener entre 6 y 12 dígitos numéricos.'
    }

    const fullName = step1.full_name.trim()
    if (!fullName) {
      errs.full_name = 'El nombre completo es obligatorio.'
    } else if (/\d/.test(fullName)) {
      errs.full_name = 'El nombre no puede contener números.'
    } else if (fullName.split(/\s+/).filter(Boolean).length < 2) {
      errs.full_name = 'Ingresa tu nombre y apellido.'
    }

    const email = step1.email.trim()
    if (!email) {
      errs.email = 'El correo electrónico es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Ingresa un correo electrónico válido.'
    }

    // phone is stored as dialCode+digits e.g. "+573001234567"
    const phoneDigits = step1.phone.replace(/^\+\d{1,4}/, '')
    if (!phoneDigits) {
      errs.phone = 'El teléfono es obligatorio.'
    } else if (!/^\d{7,15}$/.test(phoneDigits)) {
      errs.phone = 'Ingresa un número de teléfono válido (7–15 dígitos).'
    }

    const fbUrl = step1.fb_profile_url.trim()
    if (!fbUrl) {
      errs.fb_profile_url = 'El perfil de Facebook es obligatorio.'
    } else {
      try {
        const url = new URL(fbUrl)
        const hostname = url.hostname.replace(/^www\./, '')
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
        if (hostname !== 'facebook.com') {
          errs.fb_profile_url = 'Ingresa un enlace válido de Facebook (facebook.com/tu-perfil).'
        }
      } catch {
        errs.fb_profile_url = 'Ingresa una URL válida de Facebook.'
      }
    }

    setErrors1(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2(): boolean {
    const newErrors: Step2Errors = {}

    const businessName = step2.business_name.trim()
    if (!businessName) {
      newErrors.business_name = 'El nombre del negocio es obligatorio.'
    } else if (businessName.length < 2) {
      newErrors.business_name = 'El nombre del negocio debe tener al menos 2 caracteres.'
    }

    if (!step2.category) {
      newErrors.category = 'Selecciona una categoría.'
    } else if (!CATEGORIES.includes(step2.category as typeof CATEGORIES[number])) {
      newErrors.category = 'Categoría no válida.'
    }

    const description = step2.description.trim()
    if (!description) {
      newErrors.description = 'La descripción es obligatoria.'
    } else if (description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres.'
    } else if (description.length > 300) {
      newErrors.description = 'La descripción no puede superar los 300 caracteres.'
    }

    const businessPhoneDigits = step2.business_phone.replace(/^\+\d{1,4}/, '')
    if (!businessPhoneDigits) {
      newErrors.business_phone = 'El teléfono de WhatsApp es obligatorio.'
    } else if (!/^\d{7,15}$/.test(businessPhoneDigits)) {
      newErrors.business_phone = 'Ingresa un número válido (7–15 dígitos).'
    }

    const instagram = step2.instagram_handle?.trim()
    if (instagram) {
      const usernameOnly = instagram
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
        .replace(/^@/, '')
        .replace(/\/$/, '')
      if (!/^[\w.]{1,30}$/.test(usernameOnly)) {
        newErrors.instagram_handle = 'Usuario de Instagram no válido. Usa @usuario o el enlace de tu perfil.'
      }
    }

    const website = step2.website_url?.trim()
    if (website) {
      try {
        const url = new URL(website)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      } catch {
        newErrors.website_url = 'Ingresa una URL válida para el sitio web.'
      }
    }

    if (step2.offers_discount && !step2.discount_details?.trim()) {
      newErrors.discount_details = 'Describe el descuento que ofreces.'
    }

    setErrors2(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep3(): boolean {
    const newErrors: Step3Errors = {}

    if (!step3.product_id) {
      newErrors.product_id = 'Selecciona un plan.'
    }

    // Para planes pagos usamos la pasarela Wompi, por lo que el comprobante no es obligatorio.
    // Si el usuario provee un comprobante manual, validamos formato y tamaño.
    if (step3.receipt) {
      if (!ALLOWED_RECEIPT_TYPES.includes(step3.receipt.type)) {
        newErrors.receipt = 'El comprobante debe ser una imagen (JPG, PNG, WebP) o PDF.'
      } else if (step3.receipt.size > MAX_FILE_SIZE) {
        newErrors.receipt = 'El archivo no puede superar los 5 MB.'
      }
    }

    if (!step3.consent_accepted) {
      newErrors.consent_accepted = 'Debes aceptar los términos para continuar.'
    }

    setErrors3(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  function handleNext() {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep3()) return

    const isPaidPlan = selectedProduct !== null && selectedProduct.price_cop > 0

    // ── Flujo Wompi: crear aplicación pendiente en servidor y redirigir ───────
    if (isPaidPlan) {
      const editorialStatus =
        acceptedReview !== null
          ? 'ia_aceptada'
          : latestReviewResult !== null
          ? 'ia_sugerida'
          : 'requiere_revision_manual'

      const reviewId = acceptedReview?.reviewId ?? latestReviewResult?.reviewId ?? null

      const payload: Record<string, unknown> = {
        cedula: step1.cedula.trim(),
        full_name: step1.full_name.trim(),
        email: step1.email.trim(),
        phone: step1.phone.trim(),
        fb_profile_url: step1.fb_profile_url.trim(),
        business_name: step2.business_name.trim(),
        description: step2.description.trim(),
        category: step2.category,
        business_phone: step2.business_phone.trim(),
        offers_discount: step2.offers_discount,
        product_id: step3.product_id,
        description_editorial_status: editorialStatus,
        description_review_id: reviewId,
      }
      if (step2.instagram_handle.trim()) payload.instagram_handle = step2.instagram_handle.trim()
      if (step2.website_url.trim()) payload.website_url = step2.website_url.trim()
      if (step2.other_socials.trim()) payload.other_socials = step2.other_socials.trim()
      if (step2.offers_discount && step2.discount_details.trim()) {
        payload.discount_details = step2.discount_details.trim()
      }

      setSubmitting(true)
      setSubmitError(null)
      try {
        const res = await fetch('/api/solicitudes/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!json.success) {
          setSubmitError(json.message ?? 'No se pudo crear la aplicación.')
          setSubmitting(false)
          return
        }

        const applicationId = json.applicationId
        const checkoutUrl = json.checkoutUrl

        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else if (applicationId) {
          // fallback: construir URL en cliente si servidor no la devolvió
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
          const redirectUrl = `${baseUrl}/inscripcion/confirmacion?applicationId=${encodeURIComponent(applicationId)}`
          const amountCop = selectedProduct?.price_cop

          if (typeof amountCop !== 'number' || Number.isNaN(amountCop) || amountCop <= 0) {
            setSubmitError('No se pudo iniciar el pago porque el plan seleccionado no tiene un valor válido.')
            setSubmitting(false)
            return
          }

          try {
            const wompiUrl = buildWompiCheckoutUrl({
              reference: applicationId,
              amountCop,
              redirectUrl,
            })
            window.location.href = wompiUrl
          } catch {
            setSubmitError('No se pudo iniciar el pago. Revisa tu conexión e intenta de nuevo.')
          }
        } else {
          setSubmitError('No se pudo iniciar el pago. Intenta de nuevo.')
        }
      } catch {
        setSubmitError('Error de conexión. Revisa tu internet e intenta de nuevo.')
      } finally {
        setSubmitting(false)
      }

      return
    }

    // ── Flujo gratuito: envío directo ─────────────────────────────────────────
    setSubmitting(true)
    setSubmitError(null)

    const fd = new FormData()

    fd.append('cedula', step1.cedula.trim())
    fd.append('full_name', step1.full_name.trim())
    fd.append('email', step1.email.trim())
    fd.append('phone', step1.phone.trim())
    fd.append('fb_profile_url', step1.fb_profile_url.trim())

    fd.append('business_name', step2.business_name.trim())
    fd.append('description', step2.description.trim())
    fd.append('category', step2.category)
    fd.append('business_phone', step2.business_phone.trim())
    fd.append('offers_discount', String(step2.offers_discount))
    if (step2.instagram_handle.trim()) fd.append('instagram_handle', step2.instagram_handle.trim())
    if (step2.website_url.trim()) fd.append('website_url', step2.website_url.trim())
    if (step2.other_socials.trim()) fd.append('other_socials', step2.other_socials.trim())
    if (step2.offers_discount && step2.discount_details.trim()) {
      fd.append('discount_details', step2.discount_details.trim())
    }

    fd.append('product_id', step3.product_id)
    fd.append('consent_accepted', 'true')
    if (step3.receipt) fd.append('receipt', step3.receipt)
    if (step3.post_screenshot) fd.append('post_screenshot', step3.post_screenshot)

    const editorialStatus =
      acceptedReview !== null
        ? 'ia_aceptada'
        : latestReviewResult !== null
        ? 'ia_sugerida'
        : 'requiere_revision_manual'
    fd.append('description_editorial_status', editorialStatus)

    const reviewId = acceptedReview?.reviewId ?? latestReviewResult?.reviewId ?? null
    if (reviewId) fd.append('description_review_id', reviewId)

    try {
      const res = await fetch('/api/solicitudes', { method: 'POST', body: fd })
      const json = (await res.json()) as { success: boolean; message: string }

      if (json.success) {
        setSubmitted(true)
      } else {
        setSubmitError(json.message ?? 'Ocurrió un error. Intenta de nuevo.')
      }
    } catch {
      setSubmitError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Confirmation screen ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <main className="min-h-screen bg-[--bg] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl text-sw-cream"
            style={{ background: 'var(--accent)' }}
          >
            ✓
          </div>
          <h1 className="sw-display sw-h2 text-[--fg]">¡Solicitud recibida!</h1>
          <p className="text-[--fg-2] leading-relaxed text-sm">
            Revisaremos tu información y te contactaremos en los próximos días. Estamos emocionadas
            de conocer tu emprendimiento.
          </p>
        </div>
      </main>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[--bg] px-4 py-12">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="sw-eyebrow mb-2">SW Mujeres</p>
          <h1 className="sw-display sw-h2 text-[--fg]">Inscríbete al directorio</h1>
          <p className="text-[--fg-3] text-sm mt-2">
            Comparte tu emprendimiento con la comunidad SW Mujeres
          </p>
        </div>

        <StepIndicator current={currentStep} />

        {/* Card */}
        <div
          className="bg-sw-paper rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: 'var(--sw-line)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {currentStep === 1 && (
            <Step1Form
              data={step1}
              errors={errors1}
              onChange={(field, value) => {
                setStep1((prev) => ({ ...prev, [field]: value }))
                if (errors1[field]) setErrors1((prev) => ({ ...prev, [field]: undefined }))
              }}
            />
          )}

          {currentStep === 2 && (
            <Step2Form
              data={step2}
              errors={errors2}
              onChange={(field, value) => {
                setStep2((prev) => ({ ...prev, [field]: value }))
                if (field === 'description' && acceptedReview !== null) {
                  setAcceptedReview(null)
                }
                const key = field as Step2Fields
                if (errors2[key]) setErrors2((prev) => ({ ...prev, [key]: undefined }))
              }}
              acceptedReview={acceptedReview}
              onReviewResult={handleReviewResult}
              onReviewAccepted={handleReviewAccepted}
            />
          )}

          {currentStep === 3 && (
            <Step3Form
              data={step3}
              errors={errors3}
              products={products}
              productsLoading={productsLoading}
              productsError={productsError}
              selectedProduct={selectedProduct}
              onChange={(field, value) => {
                setStep3((prev) => {
                  if (field !== 'product_id') {
                    return { ...prev, [field]: value }
                  }

                  const nextProduct = products.find((product) => product.id === value) ?? null
                  return {
                    ...prev,
                    product_id: String(value),
                    post_screenshot: isSinglePublicationProduct(nextProduct)
                      ? prev.post_screenshot
                      : null,
                  }
                })
                const key = field as keyof Step3Errors
                if (errors3[key]) setErrors3((prev) => ({ ...prev, [key]: undefined }))
              }}
            />
          )}

          {/* Navigation */}
          <div className={`flex mt-8 pt-6 border-t ${currentStep > 1 ? 'justify-between' : 'justify-end'}`}
            style={{ borderColor: 'var(--sw-line)' }}
          >
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-[--fg-3] hover:text-[--fg] transition-colors disabled:opacity-50"
              >
                ← Volver
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg text-sw-cream transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)' }}
              >
                Continuar →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || productsLoading}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg text-sw-cream transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}
              >
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            )}
          </div>

          {submitError && (
            <p className="mt-4 text-sm text-sw-burgundy text-center">{submitError}</p>
          )}
        </div>
      </div>
    </main>
  )
}
