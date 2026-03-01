export type ProductType = 'PLAYER' | 'FAN' | 'RETRO'

export type Team =
  | 'LIVERPOOL'
  | 'MU'
  | 'ARSENAL'
  | 'CHELSEA'
  | 'MAN_CITY'
  | 'REAL'
  | 'BARCA'
  | 'NATIONAL'
  | 'SALE'
  | 'OTHER'

export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'

export type OrderStatus = 'Processing' | 'Confirmed'

export interface SizeQuantity {
  size: Size
  quantity: number
}

export interface IProduct {
  _id: string
  name: string
  price: number
  tag: string[]
  type: ProductType
  team: Team
  sizes: SizeQuantity[]
  description: string
  imageUrl: string[]
  createdAt: string
  updatedAt: string
}

export interface IOrder {
  _id: string
  customerName: string
  phoneNumber: string
  address: string
  productId: string | IProduct
  size: Size
  quantity: number
  uuid: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  search?: string
  type?: ProductType | ''
  team?: Team | ''
}

export const TEAM_LABELS: Record<Team, string> = {
  LIVERPOOL: 'Liverpool',
  MU: 'Man United',
  ARSENAL: 'Arsenal',
  CHELSEA: 'Chelsea',
  MAN_CITY: 'Man City',
  REAL: 'Real Madrid',
  BARCA: 'Barcelona',
  NATIONAL: 'Đội Tuyển',
  SALE: 'Sale',
  OTHER: 'Khác',
}

export const TYPE_LABELS: Record<ProductType, string> = {
  PLAYER: 'Player',
  FAN: 'Fan',
  RETRO: 'Retro',
}

export const SIZE_OPTIONS: Size[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
export const TEAM_OPTIONS: Team[] = [
  'LIVERPOOL', 'MU', 'ARSENAL', 'CHELSEA', 'MAN_CITY',
  'REAL', 'BARCA', 'NATIONAL', 'SALE', 'OTHER',
]
