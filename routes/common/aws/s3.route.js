import express from 'express';
import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { s3Controller } from 'controllers/common';
import { s3Validation } from 'validations/common';

const router = express();
/**
 * Create pre-signed url Api
 * */
router.post('/presignedurl', auth(), validate(s3Validation.preSignedPutUrl), s3Controller.preSignedPutUrl);

router.post('/profilepic', auth(), validate(s3Validation.UserProfilePic), s3Controller.UserProfilePic);
module.exports = router;
