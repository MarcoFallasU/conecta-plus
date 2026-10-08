import type { SessionUser } from '../context/RoleContext'

export interface Account extends SessionUser {
  password: string
}

export interface Activity {
  id: string
  title: string
  description: string
  category: string
  startsAt: string
  place: string
  imageUrl: string
  createdBy: string
  featured: boolean
}

export interface FamilyLink {
  id: string
  caregiverId: string
  elderId: string
  status: 'pending' | 'active'
}

export interface Recommendation {
  id: string
  activityId: string
  fromUserId: string
  toUserId: string
}

export interface Review {
  id: string
  activityId: string
  userId: string
  rating: number
  comment: string
  createdAt: string
}
