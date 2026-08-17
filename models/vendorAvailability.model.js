import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON, softDelete } from './plugins';

import enumModel from './enum.model';

const DayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String, // 'monday', 'tuesday', etc.
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const VendorAvailabilitySchema = new mongoose.Schema(
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
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorUser',
      index: true,
    },
    storeStatus: {
      type: String,
      enum: Object.values(enumModel.EnumStoreStatus),
      default: enumModel.EnumStoreStatus.ONLINE,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    bookingOption: {
      type: String,
      enum: Object.values(enumModel.EnumBookingOption),
      default: enumModel.EnumBookingOption.INSTANT,
    },
    instantArrivalEstimate: {
      type: String,
      default: '30-40 mins',
    },
    weeklySchedule: {
      type: [DayScheduleSchema],
      default: [
        { day: 'monday', isOpen: true },
        { day: 'tuesday', isOpen: true },
        { day: 'wednesday', isOpen: true },
        { day: 'thursday', isOpen: true },
        { day: 'friday', isOpen: true },
        { day: 'saturday', isOpen: true },
        { day: 'sunday', isOpen: true },
      ],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
VendorAvailabilitySchema.plugin(toJSON);
VendorAvailabilitySchema.plugin(mongoosePaginateV2);
VendorAvailabilitySchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});
const VendorAvailabilityModel =
  mongoose.models.VendorAvailability || mongoose.model('VendorAvailability', VendorAvailabilitySchema, 'VendorAvailability');
module.exports = VendorAvailabilityModel;
