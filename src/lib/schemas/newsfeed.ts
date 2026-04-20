// @anchor: cca.newsfeed.schema
// Zod schemas for newsfeed posts.

import { z } from 'zod'

export const AudienceEnum = z.enum(['all_parents', 'classroom', 'staff'])
export type Audience = z.infer<typeof AudienceEnum>

export const CreateNewsfeedPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  body: z.string().max(5000).optional().default(''),
  audience: AudienceEnum.default('all_parents'),
  pinned: z.boolean().default(false),
})

export type CreateNewsfeedPostInput = z.infer<typeof CreateNewsfeedPostSchema>
