// @anchor: cca.contact.schema
// Zod schema for the marketing contact form.

import { z } from 'zod'

export const contactInquiryTypeEnum = z.enum([
  'current_parent',
  'prospective_parent',
  'staff_inquiry',
  'other',
])

export type ContactInquiryType = z.infer<typeof contactInquiryTypeEnum>

export const ContactMessageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().max(30).optional().default(''),
  inquiry_type: contactInquiryTypeEnum,
  message: z.string().min(10, 'Please tell us how we can help').max(5000),
  /** Honeypot — must be empty */
  website: z.string().max(0).optional().default(''),
})

export type ContactMessageData = z.infer<typeof ContactMessageSchema>
