import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { applicationsService } from '@src/features/admin/services/applications.service'
import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import { applyApprovedDescription } from '@src/features/admin/repository/applications.repository'
import { getReview, markUsed } from '@src/features/profile-editorial-review/repository'
import type { ApplicationEditorialStatus } from '@src/features/profile-editorial-review/types'
import type { ExistingReview } from '@src/features/admin/types'

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

async function approveApplicationAction(formData: FormData) {
  'use server'
  const applicationId = formData.get('applicationId') as string
  const entrepreneurId = formData.get('entrepreneurId') as string
  const durationDays = Number(formData.get('durationDays') ?? '90')
  const entrepreneurEmail = formData.get('entrepreneurEmail') as string
  const entrepreneurName = formData.get('entrepreneurName') as string
  const businessName = formData.get('businessName') as string

  const { data: bp } = await supabaseAdmin
    .from('business_profiles')
    .select('stats_token')
    .eq('entrepreneur_id', entrepreneurId)
    .maybeSingle()
  const statsToken = (bp?.stats_token as string | null) ?? undefined

  await applicationsService.approve(applicationId, entrepreneurId, durationDays, entrepreneurEmail, entrepreneurName, businessName, statsToken)
  redirect('/admin/solicitudes')
}

async function rejectApplicationAction(formData: FormData) {
  'use server'
  const applicationId = formData.get('applicationId') as string
  const entrepreneurEmail = formData.get('entrepreneurEmail') as string
  const entrepreneurName = formData.get('entrepreneurName') as string
  const notes = (formData.get('notes') as string | null) || undefined

  await applicationsService.reject(applicationId, notes, entrepreneurEmail, entrepreneurName)
  redirect('/admin/solicitudes')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function applyDescriptionAction(formData: FormData) {
  'use server'
  const applicationId       = formData.get('applicationId') as string
  const approvedDescription = (formData.get('approvedDescription') as string | null) ?? ''
  const rawReviewId         = (formData.get('reviewId') as string | null) ?? ''

  const trimmed = approvedDescription.trim()
  if (trimmed.length < 10 || trimmed.length > 1000) {
    redirect(`/admin/solicitudes/${applicationId}?editorialError=invalid_description`)
  }

  // Verify reviewId and retrieve assets from DB — never trust client for SEO data
  let reviewAssets: { seoTags: string[]; searchKeywords: string[]; seoDescription: string | null; aiSummary: string | null } | null = null
  let verifiedReviewId: string | null = null

  if (UUID_RE.test(rawReviewId)) {
    try {
      const review = await getReview(rawReviewId)
      if (review) {
        verifiedReviewId = rawReviewId
        reviewAssets = {
          seoTags:        review.seoTags,
          searchKeywords: review.searchKeywords,
          seoDescription: review.seoDescription,
          aiSummary:      review.aiSummary,
        }
      }
    } catch {
      // getReview failure is non-blocking — proceed without SEO assets
    }
  }

  await applyApprovedDescription({
    applicationId,
    description: trimmed,
    reviewAssets,
  })

  if (verifiedReviewId) {
    try {
      const review = await getReview(verifiedReviewId)
      if (review && !review.accepted) await markUsed(verifiedReviewId)
    } catch {
      // markUsed failure is non-blocking
    }
  }

  redirect(`/admin/solicitudes/${applicationId}`)
}

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const STATUS_BADGE: Record<'pendiente' | 'aprobado' | 'rechazado', string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<'pendiente' | 'aprobado' | 'rechazado', string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-sw-negro">{value ?? <span className="text-sw-fg3">—</span>}</dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editorial status badge
// ---------------------------------------------------------------------------

const EDITORIAL_BADGE: Record<string, string> = {
  requiere_revision_manual: 'bg-yellow-100 text-yellow-800',
  ia_sugerida:              'bg-blue-100 text-blue-800',
  ia_aceptada:              'bg-emerald-100 text-emerald-800',
  admin_aprobada:           'bg-green-100 text-green-800',
}

const EDITORIAL_LABEL: Record<string, string> = {
  requiere_revision_manual: 'Requiere revisión manual',
  ia_sugerida:              'Sugerencia IA disponible',
  ia_aceptada:              'IA aceptada por aliada',
  admin_aprobada:           'Aprobada por admin',
}

function EditorialBadge({ status }: { status: ApplicationEditorialStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
        Sin revisión
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EDITORIAL_BADGE[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {EDITORIAL_LABEL[status] ?? status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Editorial review section (read-only)
// ---------------------------------------------------------------------------

function Pills({ items, emptyText }: { items: string[]; emptyText?: string }) {
  if (items.length === 0) return <span className="text-sm text-sw-fg3">{emptyText ?? '—'}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-block rounded px-2 py-0.5 text-xs bg-gray-100 text-sw-fg2">
          {item}
        </span>
      ))}
    </div>
  )
}

function DescriptionReviewSection({
  editorialStatus,
  descriptionReviewed,
  reviewId,
  existingReview,
  applicationId,
  currentDescription,
  applyAction,
  errorMessage,
}: {
  editorialStatus: ApplicationEditorialStatus | null
  descriptionReviewed: boolean
  reviewId: string | null
  existingReview: ExistingReview | null
  applicationId?: string
  currentDescription?: string | null
  applyAction?: (fd: FormData) => Promise<void>
  errorMessage?: string | null
}) {
  return (
    <section className="rounded-lg border border-sw-line bg-sw-paper p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-sw-line pb-3">
        <h2 className="text-base font-semibold text-sw-negro">Revisión de descripción</h2>
        <EditorialBadge status={editorialStatus} />
      </div>

      <p className="text-xs text-sw-fg3">
        Descripción revisada:{' '}
        <span className={descriptionReviewed ? 'text-emerald-700 font-medium' : 'text-yellow-700 font-medium'}>
          {descriptionReviewed ? 'Sí' : 'No'}
        </span>
      </p>

      {!existingReview ? (
        <p className="text-sm text-sw-fg3">No hay revisión IA asociada a esta solicitud.</p>
      ) : (
        <div className="space-y-4">
          {existingReview.suggested_text && (
            <div>
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide mb-1.5">
                Texto sugerido por IA
              </dt>
              <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-sw-negro leading-relaxed">
                {existingReview.suggested_text}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide mb-1.5">SEO Tags</dt>
              <Pills items={existingReview.seo_tags} />
            </div>
            <div>
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide mb-1.5">Keywords de búsqueda</dt>
              <Pills items={existingReview.search_keywords} />
            </div>
          </div>

          {existingReview.seo_description && (
            <div>
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide mb-1.5">Descripción SEO</dt>
              <dd className="text-sm text-sw-fg2 leading-relaxed">{existingReview.seo_description}</dd>
            </div>
          )}

          {existingReview.ai_summary && (
            <div>
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide mb-1.5">Resumen IA</dt>
              <dd className="text-sm text-sw-fg2 leading-relaxed">{existingReview.ai_summary}</dd>
            </div>
          )}

          {reviewId && (
            <p className="text-xs text-sw-fg3 font-mono">Review ID: {reviewId}</p>
          )}
        </div>
      )}

      {applyAction && applicationId && (
        <div className="border-t border-sw-line pt-4 space-y-3">
          {errorMessage && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errorMessage}
            </p>
          )}
          <form action={applyAction} className="space-y-3">
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="reviewId" value={reviewId ?? ''} />
            <div>
              <label className="text-xs font-medium text-sw-fg3 uppercase tracking-wide block mb-1.5">
                Descripción aprobada
              </label>
              <textarea
                name="approvedDescription"
                rows={5}
                minLength={10}
                maxLength={1000}
                defaultValue={existingReview?.suggested_text ?? currentDescription ?? ''}
                className="w-full rounded-md border border-sw-line px-3 py-2 text-sm text-sw-negro placeholder-sw-fg3 focus:outline-none focus:ring-2 focus:ring-sw-burgundy resize-none"
                placeholder="Escribe o confirma la descripción aprobada…"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-sw-burgundy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Aplicar descripción aprobada
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminSolicitudDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editorialError?: string }>
}) {
  const { id } = await params
  const { editorialError } = await searchParams
  const solicitud = await applicationsService.getById(id)

  if (!solicitud) notFound()

  // Public URLs para los archivos de Storage
  const receiptUrl = solicitud.receipt_path
    ? supabaseAdmin.storage.from('recipts').getPublicUrl(solicitud.receipt_path).data.publicUrl
    : null

  const screenshotUrl = solicitud.post_screenshot_path
    ? supabaseAdmin.storage
        .from('post_screenshots')
        .getPublicUrl(solicitud.post_screenshot_path).data.publicUrl
    : null

  const { entrepreneur: ent, business_profile: bp, product, status } = solicitud

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-sw-fg3">
        <Link href="/admin/solicitudes" className="hover:text-sw-fg2">
          Solicitudes
        </Link>
        <span>→</span>
        <span className="text-sw-negro font-medium">{bp.business_name ?? 'Sin nombre'}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-sw-negro">
          {bp.business_name ?? 'Sin nombre'}
        </h1>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Datos de la empresaria */}
      <section className="rounded-lg border border-sw-line bg-sw-paper p-6 space-y-4">
        <h2 className="text-base font-semibold text-sw-negro border-b border-sw-line pb-3">
          Datos de la empresaria
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre completo" value={ent.full_name} />
          <Field label="Cédula" value={ent.cedula} />
          <Field label="Email" value={ent.email} />
          <Field label="Teléfono" value={ent.phone} />
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide">Perfil de Facebook</dt>
            <dd className="mt-1 text-sm">
              {ent.fb_profile_url ? (
                <a href={ent.fb_profile_url} target="_blank" rel="noopener noreferrer" className="text-sw-burgundy hover:underline break-all">
                  {ent.fb_profile_url}
                </a>
              ) : (
                <span className="text-sw-fg3">—</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Datos del negocio */}
      <section className="rounded-lg border border-sw-line bg-sw-paper p-6 space-y-4">
        <h2 className="text-base font-semibold text-sw-negro border-b border-sw-line pb-3">
          Datos del negocio
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre del negocio" value={bp.business_name} />
          <Field label="Categoría" value={bp.category} />
          <div className="sm:col-span-2">
            <Field label="Descripción" value={bp.description} />
          </div>
          <Field label="WhatsApp" value={bp.business_phone} />
          <Field label="Instagram" value={bp.instagram_handle ? `@${bp.instagram_handle}` : null} />
          {bp.website_url && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide">Sitio web</dt>
              <dd className="mt-1 text-sm">
                <a href={bp.website_url} target="_blank" rel="noopener noreferrer" className="text-sw-burgundy hover:underline break-all">
                  {bp.website_url}
                </a>
              </dd>
            </div>
          )}
          {bp.offers_discount && bp.discount_details && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-sw-fg3 uppercase tracking-wide">Descuento especial SW</dt>
              <dd className="mt-1 text-sm text-sw-negro">{bp.discount_details}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Revisión de descripción */}
      <DescriptionReviewSection
        editorialStatus={solicitud.description_editorial_status}
        descriptionReviewed={solicitud.description_reviewed}
        reviewId={solicitud.description_review_id}
        existingReview={solicitud.existing_review}
        applicationId={solicitud.id}
        currentDescription={bp.description}
        applyAction={status === 'pendiente' ? applyDescriptionAction : undefined}
        errorMessage={editorialError === 'invalid_description' ? 'La descripción debe tener entre 10 y 1000 caracteres.' : null}
      />

      {/* Plan y pago */}
      <section className="rounded-lg border border-sw-line bg-sw-paper p-6 space-y-4">
        <h2 className="text-base font-semibold text-sw-negro border-b border-sw-line pb-3">
          Plan y pago
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Plan" value={product.name} />
          <Field
            label="Monto pagado"
            value={product.price_cop === 0 ? 'Gratuito' : `$${product.price_cop.toLocaleString('es-CO')} COP`}
          />
          <Field label="Enviada el" value={formatDate(solicitud.submitted_at)} />
          {solicitud.reviewed_at && (
            <Field label="Revisada el" value={formatDate(solicitud.reviewed_at)} />
          )}
        </dl>

        {/* Pago con Wompi */}
        {solicitud.wompi_reference && (
          <div className="mt-2 rounded-lg border border-sw-line bg-sw-cream px-4 py-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-sw-fg3">Pago vía Wompi</p>
            <p className="text-sm text-sw-negro">
              <span className="text-sw-fg3">Referencia: </span>
              <span className="font-mono">{solicitud.wompi_reference}</span>
            </p>
            {solicitud.wompi_status && (
              <p className="text-sm text-sw-negro">
                <span className="text-sw-fg3">Estado: </span>
                {solicitud.wompi_status}
              </p>
            )}
            {solicitud.payment_completed_at && (
              <p className="text-sm text-sw-negro">
                <span className="text-sw-fg3">Pagado el: </span>
                {formatDate(solicitud.payment_completed_at)}
              </p>
            )}
          </div>
        )}

        {/* Archivos */}
        <div className="flex flex-wrap gap-3 pt-2">
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-sw-line bg-sw-paper px-3 py-2 text-sm font-medium text-sw-fg2 hover:bg-sw-cream transition-colors"
            >
              Ver comprobante de pago ↗
            </a>
          )}
          {screenshotUrl && (
            <a
              href={screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-sw-line bg-sw-paper px-3 py-2 text-sm font-medium text-sw-fg2 hover:bg-sw-cream transition-colors"
            >
              Ver captura del post ↗
            </a>
          )}
        </div>
      </section>

      {/* Acciones */}
      {status === 'pendiente' ? (
        <section className="rounded-lg border border-sw-line bg-sw-paper p-6 space-y-6">
          <h2 className="text-base font-semibold text-sw-negro border-b border-sw-line pb-3">
            Decisión
          </h2>

          {/* Aprobar */}
          <div>
            <p className="text-sm text-sw-fg2 mb-3">
              Aprobar activa la membresía por {product.duration_days ?? 90} días y notifica a la empresaria por email.
            </p>
            <form action={approveApplicationAction}>
              <input type="hidden" name="applicationId" value={solicitud.id} />
              <input type="hidden" name="entrepreneurId" value={ent.id} />
              <input type="hidden" name="durationDays" value={String(product.duration_days ?? 90)} />
              <input type="hidden" name="entrepreneurEmail" value={ent.email ?? ''} />
              <input type="hidden" name="entrepreneurName" value={ent.full_name ?? ''} />
              <input type="hidden" name="businessName" value={bp.business_name ?? ''} />
              <button
                type="submit"
                className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Aprobar solicitud
              </button>
            </form>
          </div>

          <hr className="border-sw-line" />

          {/* Rechazar */}
          <div>
            <p className="text-sm text-sw-fg2 mb-3">
              Rechazar desactiva la membresía y notifica a la empresaria por email. La nota es opcional.
            </p>
            <form action={rejectApplicationAction} className="space-y-3">
              <input type="hidden" name="applicationId" value={solicitud.id} />
              <input type="hidden" name="entrepreneurEmail" value={ent.email ?? ''} />
              <input type="hidden" name="entrepreneurName" value={ent.full_name ?? ''} />
              <textarea
                name="notes"
                rows={3}
                placeholder="Nota para la empresaria (opcional)…"
                className="w-full rounded-md border border-sw-line px-3 py-2 text-sm text-sw-negro placeholder-sw-fg3 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <button
                type="submit"
                className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Rechazar solicitud
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-sw-line bg-sw-paper p-6">
          <p className="text-sm text-sw-fg2">
            Esta solicitud fue{' '}
            <span className={`font-medium ${status === 'aprobado' ? 'text-green-700' : 'text-red-700'}`}>
              {STATUS_LABELS[status].toLowerCase()}
            </span>
            {solicitud.reviewed_at ? ` el ${formatDate(solicitud.reviewed_at)}` : ''}.
          </p>
          {solicitud.notes && (
            <p className="mt-2 text-sm text-sw-fg2">
              <strong>Nota:</strong> {solicitud.notes}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
