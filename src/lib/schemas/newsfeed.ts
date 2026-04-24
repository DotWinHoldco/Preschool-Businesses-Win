import { z } from 'zod'

export const ScopeEnum = z.enum(['school_wide', 'classroom'])
export type Scope = z.infer<typeof ScopeEnum>

export const PostTypeEnum = z.enum(['announcement', 'reminder', 'photo', 'shoutout'])
export type PostType = z.infer<typeof PostTypeEnum>

export const CreateNewsfeedPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  scope: ScopeEnum.default('school_wide'),
  classroom_id: z.string().uuid().optional().nullable(),
  post_type: PostTypeEnum.default('announcement'),
  pinned: z.boolean().default(false),
})

export type CreateNewsfeedPostInput = z.infer<typeof CreateNewsfeedPostSchema>

export const UpdateNewsfeedPostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  scope: ScopeEnum.optional(),
  classroom_id: z.string().uuid().optional().nullable(),
  post_type: PostTypeEnum.optional(),
  pinned: z.boolean().optional(),
})

export type UpdateNewsfeedPostInput = z.infer<typeof UpdateNewsfeedPostSchema>

export const AddCommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1, 'Comment is required').max(2000),
  parent_comment_id: z.string().uuid().optional().nullable(),
})

export type AddCommentInput = z.infer<typeof AddCommentSchema>
