import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import enumModel from 'models/enum.model';
import { toJSON, softDelete } from './plugins';

const AddressSchema = new mongoose.Schema(
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
    address: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    floor: {
      type: String,
    },
    locationType: {
      type: String,
      enum: Object.values(enumModel.EnumLocationTypeOfAddress),
    },
    landmark: {
      type: String,
    },
    receiverName: {
      type: String,
    },
    receiverMobile: {
      type: Number,
    },
    isDefault: {
      type: Boolean,
    },
    location: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
AddressSchema.plugin(toJSON);
AddressSchema.plugin(mongoosePaginateV2);
AddressSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});
const AddressModel = mongoose.models.Address || mongoose.model('Address', AddressSchema, 'Address');
module.exports = AddressModel;
