import * as React from 'react'
import { render } from '@react-email/render'
import type { SupabaseClient } from '@supabase/supabase-js'
import { template as orderConfirmation } from '@/lib/email-templates/order-confirmation'

const SITE_NAME = 'Rancho Viejo Mates'
const SENDER_DOMAIN = 'notify.ranchoviejo.com.ar'
const FROM_DOMAIN = 'ranchoviejo.com.ar'
const TEMPLATE_NAME = 'order-confirmation'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface OrderConfirmationPayload {
  orderId: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number; unit_price_cents: number }>
  totalCents: number
  shippingAddress?: string | null
  shippingCity?: string | null
  shippingProvince?: string | null
  shippingZip?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
}

/**
 * Encola el email de confirmación de compra usando el cliente Supabase provisto
 * (público/anon). Usamos la RPC SECURITY DEFINER `enqueue_email`, así no necesitamos
 * la service role key (que no está disponible en Vercel).
 */
export async function sendOrderConfirmationEmail(
  supabase: SupabaseClient<any>,
  payload: OrderConfirmationPayload,
  opts?: { deliverTo?: string | null; keySuffix?: string; subjectPrefix?: string },
) {
  const recipient = (opts?.deliverTo ?? payload.customerEmail)?.trim()
  if (!recipient) return { ok: false, reason: 'no_recipient' as const }

  const messageId = (globalThis.crypto?.randomUUID?.() ?? generateToken())
  const idempotencyKey = `order-confirm-${payload.orderId}${opts?.keySuffix ?? ''}`

  const unsubscribeToken = generateToken()

  try {
    const templateData = {
      customerName: payload.customerName,
      orderId: payload.orderId,
      items: payload.items,
      totalCents: payload.totalCents,
      shippingAddress: payload.shippingAddress,
      shippingCity: payload.shippingCity,
      shippingProvince: payload.shippingProvince,
      shippingZip: payload.shippingZip,
      contactPhone: payload.contactPhone,
      contactEmail: payload.contactEmail,
      siteName: SITE_NAME,
    }

    const element = React.createElement(orderConfirmation.component, templateData)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const baseSubject =
      typeof orderConfirmation.subject === 'function'
        ? orderConfirmation.subject(templateData)
        : orderConfirmation.subject
    const subject = `${opts?.subjectPrefix ?? ''}${baseSubject}`


    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: TEMPLATE_NAME,
        template_name: TEMPLATE_NAME,
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('enqueue_email failed', enqueueError)
      return { ok: false, reason: 'enqueue_failed' as const }
    }

    return { ok: true as const, messageId }
  } catch (err) {
    console.error('sendOrderConfirmationEmail error', err)
    return { ok: false, reason: 'error' as const }
  }
}
