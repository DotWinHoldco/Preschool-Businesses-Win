// @anchor: cca.notify.template.payment-receipt
// Email template: Payment receipt

import * as React from 'react'

interface PaymentReceiptProps { parentName: string; amountCents: number; paymentDate: string; invoiceNumber: string; paymentMethod: string; schoolName: string }

export function PaymentReceiptEmail({ parentName, amountCents, paymentDate, invoiceNumber, paymentMethod, schoolName }: PaymentReceiptProps) {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>Payment Received</h1>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>Hi {parentName},</p>
      <p style={{ fontSize: 15, color: '#2E2E3D', lineHeight: 1.6 }}>We have received your payment. Here are the details:</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, margin: '16px 0' }}>
        <tbody>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Amount</td><td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14, textAlign: 'right' as const }}>${(amountCents / 100).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Date</td><td style={{ padding: '8px 0', fontSize: 14, textAlign: 'right' as const }}>{paymentDate}</td></tr>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Invoice</td><td style={{ padding: '8px 0', fontSize: 14, textAlign: 'right' as const }}>{invoiceNumber}</td></tr>
          <tr><td style={{ padding: '8px 0', color: '#737373', fontSize: 14 }}>Method</td><td style={{ padding: '8px 0', fontSize: 14, textAlign: 'right' as const }}>{paymentMethod}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: '#737373', marginTop: 24 }}>Thank you for your prompt payment. - {schoolName}</p>
    </div>
  )
}
