// Centraliza todos los envíos de email transaccional de SW Mujeres usando Nodemailer + Gmail SMTP,
// evitando dispersar configuración de transporte y plantillas HTML por toda la aplicación.

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
})

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"SW Mujeres" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[sendEmail] Error al enviar correo:', err)
    throw err
  }
}

export async function notifyAdminNewApplication(data: {
  entrepreneurName: string
  businessName: string
  category: string
}): Promise<void> {
  const adminEmails = (process.env.EMAIL_ADMIN ?? '').split(',').map((e) => e.trim()).filter(Boolean)

  if (adminEmails.length === 0) {
    console.warn('[notifyAdminNewApplication] EMAIL_ADMIN no está configurado.')
    return
  }

  const subject = `Nueva solicitud de ingreso: ${data.businessName}`
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #7c3aed;">Nueva solicitud en SW Mujeres</h2>
      <p>Hola, se ha recibido una nueva solicitud de ingreso al directorio de emprendimientos.</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; background: #f5f3ff;">Empresaria</td>
          <td style="padding: 8px 12px;">${data.entrepreneurName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; background: #f5f3ff;">Emprendimiento</td>
          <td style="padding: 8px 12px;">${data.businessName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; background: #f5f3ff;">Categoría</td>
          <td style="padding: 8px 12px;">${data.category}</td>
        </tr>
      </table>
      <p style="margin-top: 24px; color: #555;">
        Ingresa al panel de administración para revisar y gestionar esta solicitud.
      </p>
    </div>
  `

  await sendEmail(adminEmails, subject, html)
}

export async function notifyEntrepreneurApproved(data: {
  to: string
  entrepreneurName: string
  businessName: string
  statsToken?: string
}): Promise<void> {
  const subject = `¡Tu emprendimiento fue aprobado en SW Mujeres! 🎉`

  const statsSection = data.statsToken
    ? `
    <p style="margin-top: 24px;">
      Puedes ver cuántas personas han visitado tu perfil y cuántos clicks han hecho en tus canales
      de contacto desde tu página privada de estadísticas:
    </p>
    <div style="margin: 16px 0; text-align: center;">
      <a
        href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://swmujeres.com'}/estadisticas/${data.statsToken}"
        style="background-color: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;"
      >
        Ver mis estadísticas
      </a>
    </div>
    <p style="font-size: 13px; color: #888;">
      Guarda este link — es privado y solo tú lo tienes.
    </p>
  `
    : ''

  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #7c3aed;">¡Felicitaciones, ${data.entrepreneurName}!</h2>
      <p>
        Nos alegra mucho informarte que <strong>${data.businessName}</strong> ha sido aprobado
        y ya forma parte del directorio de emprendimientos de <strong>SW Mujeres</strong>.
      </p>
      <p>
        Tu emprendimiento ya está visible para toda nuestra comunidad. Gracias por confiar en nosotras
        y por ser parte de esta red de mujeres que se impulsan mutuamente.
      </p>
      ${statsSection}
      <p style="margin-top: 24px; color: #555;">
        Con cariño,<br />
        <strong>El equipo de SW Mujeres</strong>
      </p>
    </div>
  `

  await sendEmail(data.to, subject, html)
}

export async function sendMagicLinkEmail(data: {
  to: string
  magicLinkUrl: string
}): Promise<void> {
  const subject = `Tu link de acceso al panel de SW Mujeres`
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #7c3aed;">Acceso al panel de administración</h2>
      <p>Hola, recibimos una solicitud de acceso al panel de SW Mujeres.</p>
      <p>Haz clic en el botón para ingresar. Este link es válido por <strong>15 minutos</strong> y solo puede usarse una vez.</p>
      <div style="margin: 32px 0; text-align: center;">
        <a
          href="${data.magicLinkUrl}"
          style="background-color: #7c3aed; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;"
        >
          Ingresar al panel
        </a>
      </div>
      <p style="font-size: 13px; color: #888;">
        Si no solicitaste este link, ignora este mensaje. Tu cuenta permanece segura.
      </p>
      <p style="font-size: 13px; color: #aaa;">
        O copia y pega esta URL en tu navegador:<br />
        <a href="${data.magicLinkUrl}" style="color: #7c3aed;">${data.magicLinkUrl}</a>
      </p>
    </div>
  `

  try {
    await sendEmail(data.to, subject, html)
  } catch (err) {
    console.error('NODEMAILER ERROR:', err)
    throw err
  }
}

export async function sendOtpEmail(data: {
  to: string
  code: string
}): Promise<void> {
  const subject = `Tu código de acceso SW — ${data.code}`
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #7c3aed;">Acceso al panel de administración</h2>
      <p>Tu código de acceso es:</p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #7c3aed;">
          ${data.code}
        </span>
      </div>
      <p style="color: #555;">Válido por <strong>10 minutos</strong>. Solo puede usarse una vez.</p>
      <p style="font-size: 13px; color: #888; margin-top: 24px;">
        Si no solicitaste este código, ignora este mensaje. Tu cuenta permanece segura.
      </p>
    </div>
  `

  try {
    await sendEmail(data.to, subject, html)
  } catch (err) {
    console.error('NODEMAILER ERROR:', err)
    throw err
  }
}

export async function notifyEntrepreneurRejected(data: {
  to: string
  entrepreneurName: string
  notes?: string
}): Promise<void> {
  const subject = `Actualización sobre tu solicitud en SW Mujeres`
  const notesSection = data.notes
    ? `<p><strong>Comentarios del equipo:</strong><br />${data.notes}</p>`
    : ''

  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #7c3aed;">Hola, ${data.entrepreneurName}</h2>
      <p>
        Gracias por tomarte el tiempo de solicitar tu ingreso al directorio de
        <strong>SW Mujeres</strong>.
      </p>
      <p>
        Luego de revisar tu solicitud, en esta oportunidad no podemos incorporarla al directorio.
        Valoramos tu interés y te animamos a volver a intentarlo en el futuro.
      </p>
      ${notesSection}
      <p style="margin-top: 24px; color: #555;">
        Si tienes dudas o quieres más información, no dudes en escribirnos.<br /><br />
        Con respeto y afecto,<br />
        <strong>El equipo de SW Mujeres</strong>
      </p>
    </div>
  `

  await sendEmail(data.to, subject, html)
}
