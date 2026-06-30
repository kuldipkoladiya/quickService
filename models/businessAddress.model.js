import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON, softDelete } from './plugins';

const BusinessAddressSchema = new mongoose.Schema(
  {
    /**
     * created By
     * */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    /**
     * updated By
     * */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addressLine1: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pinCode: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

BusinessAddressSchema.plugin(toJSON);
BusinessAddressSchema.plugin(mongoosePaginateV2);
BusinessAddressSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

const BusinessAddressModel =
  mongoose.models.BusinessAddress || mongoose.model('BusinessAddress', BusinessAddressSchema, 'BusinessAddress');
module.exports = BusinessAddressModel;
