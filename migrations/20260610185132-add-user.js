import { EnumRoleOfUser } from 'models/enum.model';
import { User } from '../models';

module.exports = {
  async up() {
    const filterForCustomer = {
      email: 'customer@gmail.com',
    };
    await User.findOneAndUpdate(
      filterForCustomer,
      {
        password: 'customer@123',
        name: 'testcustomer',
        role: EnumRoleOfUser.CUSTOMER,
        emailVerified: true,
      },
      { upsert: true }
    );
    const filterForVendor = {
      email: 'vendor@gmail.com',
    };
    await User.findOneAndUpdate(
      filterForVendor,
      {
        password: 'vendor@123',
        name: 'testvendor',
        role: EnumRoleOfUser.VENDOR,
        emailVerified: true,
      },
      { upsert: true }
    );
    const filterForAdmin = {
      email: 'admin@gmail.com',
    };
    await User.findOneAndUpdate(
      filterForAdmin,
      {
        password: 'admin@123',
        name: 'testadmin',
        role: EnumRoleOfUser.ADMIN,
        emailVerified: true,
      },
      { upsert: true }
    );
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
