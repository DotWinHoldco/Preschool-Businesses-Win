// @anchor: cca.messaging.schema
// Zod schemas for messaging, conversations, and broadcasts.
// Matches conversations, messages, conversation_members tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Conversation type enum
// ---------------------------------------------------------------------------

export const conversationTypeEnum = z.enum([
  'direct',
  'classroom',
  'broadcast',
  'staff_only',
])

export type ConversationType = z.infer<typeof conversationTypeEnum>

// ---------------------------------------------------------------------------
// Message type enum
// ---------------------------------------------------------------------------

export const messageTypeEnum = z.enum(['text', 'photo', 'file', 'system'])
export type MessageType = z.infer<typeof messageTypeEnum>

// ---------------------------------------------------------------------------
// Send message
// ---------------------------------------------------------------------------

export const SendMessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  body: z.string().min(1, 'Message body is required').max(10000),
  message_type: messageTypeEnum.default('text'),
  file_path: z.string().optional(),
  urgent: z.boolean().default(false),
})

export type SendMessageInput = z.infer<typeof SendMessageSchema>

// ---------------------------------------------------------------------------
// Create conversation
// ---------------------------------------------------------------------------

export const CreateConversationSchema = z.object({
  type: conversationTypeEnum,
  classroom_id: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  member_ids: z.array(z.string().uuid()).min(1, 'At least one member is required'),
})

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>

// ---------------------------------------------------------------------------
// Broadcast message
// ---------------------------------------------------------------------------

export const BroadcastMessageSchema = z.object({
  scope: z.enum(['school', 'classroom', 'staff']),
  classroom_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Message body is required').max(10000),
  urgent: z.boolean().default(false),
})

export type BroadcastMessageInput = z.infer<typeof BroadcastMessageSchema>

// ---------------------------------------------------------------------------
// Conversation member role
// ---------------------------------------------------------------------------

export const conversationMemberRoleEnum = z.enum([
  'sender',
  'recipient',
  'admin',
])

export type ConversationMemberRole = z.infer<typeof conversationMemberRoleEnum>
