import express from 'express';

import validate from 'middlewares/validate';
import auth from 'middlewares/auth';
import { CountryCodeController } from 'controllers/customer';
import { countryCodeValidation } from 'validations/customer';

const router = express.Router();
router
  .route('/')
  /**
   * createCountryCode
   * */
  .post(validate(countryCodeValidation.createCountryCode), CountryCodeController.create)
  /**
   * getCountryCode // todo : add rate limit here in future
   * */
  .get(validate(countryCodeValidation.getCountryCode), CountryCodeController.list);
router
  .route('/paginated')
  /**
   * getCountryCodePaginated
   * */
  .get(auth('user'), validate(countryCodeValidation.paginatedCountryCode), CountryCodeController.paginate);
router
  .route('/:countryCodeId')
  /**
   * updateCountryCode
   * */
  .put(auth('user'), validate(countryCodeValidation.updateCountryCode), CountryCodeController.update)
  /**
   * deleteCountryCodeById
   * */
  .delete(auth('user'), validate(countryCodeValidation.deleteCountryCodeById), CountryCodeController.remove)
  /**
   * getCountryCodeById
   * */
  .get(auth('user'), validate(countryCodeValidation.getCountryCodeById), CountryCodeController.get);
export default router;
