import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  name: string
  quantity: number
  unit_price_cents: number
}

interface Props {
  customerName?: string
  orderId?: string
  items?: OrderItem[]
  totalCents?: number
  shippingAddress?: string | null
  shippingCity?: string | null
  shippingProvince?: string | null
  shippingZip?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  siteName?: string
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format((cents ?? 0) / 100)
}

const OrderConfirmationEmail = ({
  customerName = 'Cliente',
  orderId = '',
  items = [],
  totalCents = 0,
  shippingAddress,
  shippingCity,
  shippingProvince,
  shippingZip,
  contactPhone,
  contactEmail,
  siteName = 'Rancho Viejo Mates',
}: Props) => {
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : ''
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Gracias por tu compra en {siteName} — Pedido #{shortId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{siteName}</Heading>
            <Text style={tagline}>Mates, bombillas y accesorios artesanales</Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>¡Gracias por tu compra, {customerName}!</Heading>
            <Text style={paragraph}>
              Recibimos tu pedido correctamente. En breve nos vamos a poner en contacto
              para coordinar el pago y el envío.
            </Text>
            {shortId && (
              <Text style={orderBadge}>
                Pedido <strong>#{shortId}</strong>
              </Text>
            )}
          </Section>

          <Section style={card}>
            <Heading as="h3" style={h3}>Detalle del pedido</Heading>
            {items.map((it, i) => (
              <div key={i} style={row}>
                <Text style={itemName}>
                  {it.quantity}× {it.name}
                </Text>
                <Text style={itemPrice}>
                  {formatPrice(it.unit_price_cents * it.quantity)}
                </Text>
              </div>
            ))}
            <Hr style={hr} />
            <div style={row}>
              <Text style={totalLabel}>Total</Text>
              <Text style={totalValue}>{formatPrice(totalCents)}</Text>
            </div>
          </Section>

          {(shippingAddress || shippingCity) && (
            <Section style={card}>
              <Heading as="h3" style={h3}>Envío</Heading>
              {shippingAddress && <Text style={paragraph}>{shippingAddress}</Text>}
              <Text style={paragraph}>
                {[shippingCity, shippingProvince, shippingZip]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </Section>
          )}

          <Section style={card}>
            <Heading as="h3" style={h3}>Contacto</Heading>
            <Text style={paragraph}>
              Si tenés dudas, escribinos
              {contactEmail ? <> a <strong>{contactEmail}</strong></> : null}
              {contactPhone ? <> o al WhatsApp <strong>{contactPhone}</strong></> : null}.
            </Text>
          </Section>

          <Text style={footer}>
            © {new Date().getFullYear()} {siteName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) => {
    const short = data?.orderId ? String(data.orderId).slice(0, 8).toUpperCase() : ''
    return short
      ? `Confirmación de compra — Pedido #${short}`
      : 'Confirmación de compra'
  },
  displayName: 'Confirmación de compra',
  previewData: {
    customerName: 'Juan Pérez',
    orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    items: [
      { name: 'Mate imperial de algarrobo', quantity: 1, unit_price_cents: 3500000 },
      { name: 'Bombilla de alpaca', quantity: 2, unit_price_cents: 800000 },
    ],
    totalCents: 5100000,
    shippingAddress: 'Av. Siempre Viva 742',
    shippingCity: 'Rosario',
    shippingProvince: 'Santa Fe',
    shippingZip: '2000',
    contactEmail: 'hola@ranchoviejo.com.ar',
    contactPhone: '+54 9 341 000 0000',
    siteName: 'Rancho Viejo Mates',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }
const header = { textAlign: 'center' as const, padding: '16px 0' }
const h1 = { color: '#0d9488', fontSize: '28px', margin: '0', letterSpacing: '0.5px' }
const tagline = { color: '#64748b', fontSize: '13px', margin: '4px 0 0' }
const card = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '16px 0' }
const h2 = { color: '#0f172a', fontSize: '20px', margin: '0 0 8px' }
const h3 = { color: '#0f172a', fontSize: '16px', margin: '0 0 12px' }
const paragraph = { color: '#334155', fontSize: '14px', lineHeight: '22px', margin: '4px 0' }
const orderBadge = { color: '#0d9488', fontSize: '14px', marginTop: '12px' }
const row = { display: 'flex', justifyContent: 'space-between', gap: '12px' }
const itemName = { color: '#334155', fontSize: '14px', margin: '4px 0', flex: 1 }
const itemPrice = { color: '#0f172a', fontSize: '14px', margin: '4px 0', fontWeight: 600 }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const totalLabel = { color: '#0f172a', fontSize: '15px', margin: 0, fontWeight: 700 }
const totalValue = { color: '#0d9488', fontSize: '18px', margin: 0, fontWeight: 700 }
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, marginTop: '24px' }
