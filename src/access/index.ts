import type { Access, FieldAccess } from 'payload'

export const anyone: Access = () => true
export const authenticated: Access = ({ req }) => Boolean(req.user)
export const authenticatedField: FieldAccess = ({ req }) => Boolean(req.user)
/** Опубликованное видят все, черновики — только авторизованные */
export const publishedOrAuth: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
