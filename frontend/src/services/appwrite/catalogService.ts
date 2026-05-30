import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

export interface Category {
  $id: string
  name: string
  slug: string
  parentId: string | null
}

export interface Neighborhood {
  $id: string
  cityId: string
  name: string
  deliveryFee: number
  isActive: boolean
}

export interface City {
  $id: string
  name: string
  state: string
}

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.categories, [Query.orderAsc('name')])
    return documents as unknown as Category[]
  },

  async getCities(): Promise<City[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.cities)
    return documents as unknown as City[]
  },

  async getNeighborhoods(cityId: string): Promise<Neighborhood[]> {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.neighborhoods, [
      Query.equal('cityId', cityId),
      Query.equal('isActive', true),
      Query.orderAsc('name')
    ])
    return documents as unknown as Neighborhood[]
  }
}
