import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';

const DeletedCustomerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalUser: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    addresses: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    wallet: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    bookingsCount: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

DeletedCustomerSchema.plugin(toJSON);
DeletedCustomerSchema.plugin(mongoosePaginateV2);

const DeletedCustomerModel =
  mongoose.models.DeletedCustomer || mongoose.model('DeletedCustomer', DeletedCustomerSchema, 'DeletedCustomer');

module.exports = DeletedCustomerModel;
