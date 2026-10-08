import type { SessionUser } from '../context/RoleContext'

// TODO: la API será la fuente de verdad del puntaje y los umbrales (ver AGENTS.md).
export const CREATE_EVENT_REPUTATION_THRESHOLD = 50
export const REVIEW_POINTS = 15

export function canPublishEvents(user: SessionUser) {
  return user.role === 'empresa' || user.reputationScore >= CREATE_EVENT_REPUTATION_THRESHOLD
}
