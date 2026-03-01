import mongoose, { Schema, Document } from 'mongoose'
import { IProduct, ProductType, Team, Size } from '@/types'

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const SizeQuantitySchema = new Schema(
  {
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as Size[],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    tag: [{ type: String, trim: true }],
    type: {
      type: String,
      enum: ['PLAYER', 'FAN', 'RETRO'] as ProductType[],
      required: true,
    },
    team: {
      type: String,
      enum: [
        'LIVERPOOL', 'MU', 'ARSENAL', 'CHELSEA', 'MAN_CITY',
        'REAL', 'BARCA', 'NATIONAL', 'SALE', 'OTHER',
      ] as Team[],
      required: true,
    },
    sizes: [SizeQuantitySchema],
    description: { type: String, default: '' },
    imageUrl: [{ type: String }],
  },
  { timestamps: true }
)

ProductSchema.index({ name: 'text', tag: 'text' })

export default mongoose.models.Product ||
  mongoose.model<ProductDocument>('Product', ProductSchema)
