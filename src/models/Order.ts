import mongoose, { Schema, Document } from 'mongoose'
import { IOrder, OrderStatus, Size } from '@/types'

export interface OrderDocument extends Omit<IOrder, '_id'>, Document {}

const OrderSchema = new Schema<OrderDocument>(
  {
    customerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as Size[],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    uuid: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['Processing', 'Confirmed'] as OrderStatus[],
      default: 'Processing',
    },
  },
  { timestamps: true }
)

export default mongoose.models.Order ||
  mongoose.model<OrderDocument>('Order', OrderSchema)
