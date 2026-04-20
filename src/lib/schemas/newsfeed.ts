import { z } from 'zod'

export const ScopeEnum = z.enum(['school_wide', 'classroom'])
export type Scope = z.infer<typeof ScopeEnum>

export const PostTypeEnum = z.enum(['announcement', 'reminder', 'photo', 'shoutout'])
export type PostType = z.infer<typeof PostTypeEnum>

export const CreateNewsfeedPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  scope: ScopeEnum.default('school_wide'),
  post_type: PostTypeEnum.default('announcement'),
  pinned: z.boolean().default(false),
})

export type CreateNewsfeedPostInput = z.infer<typeof CreateNewsfeedPostSchema>
