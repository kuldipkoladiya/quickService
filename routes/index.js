import express from 'express';

import s3Routes from './common/aws/s3.route';

import docsRoutes from './common/docs/swagger.route';

const customerRoutes = require('./customer');
const vendorRoutes = require('./vendor');
const adminRoutes = require('./admin');

const router = express.Router();
router.use('/customer', customerRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/s3', s3Routes);
router.use('/docs', docsRoutes);
module.exports = router;
