import httpStatus from 'http-status';
import { countryCodeService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from '../../utils/pick';

export const get = catchAsync(async (req, res) => {
  const { countryCodeId } = req.params;
  const filter = {
    _id: countryCodeId,
  };
  const options = {};
  const countryCode = await countryCodeService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: countryCode });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const countryCode = await countryCodeService.getCountryCodeList(filter, options);
  return res.status(httpStatus.OK).send({ results: countryCode });
});

export const paginate = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {};
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const countryCode = await countryCodeService.getCountryCodeListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: countryCode });
});

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const options = {};
  const countryCode = await countryCodeService.createCountryCode(body, options);
  return res.status(httpStatus.CREATED).send({ results: countryCode });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { countryCodeId } = req.params;
  const filter = {
    _id: countryCodeId,
  };
  const options = { new: true };
  const countryCode = await countryCodeService.updateCountryCode(filter, body, options);
  return res.status(httpStatus.OK).send({ results: countryCode });
});

export const remove = catchAsync(async (req, res) => {
  const { countryCodeId } = req.params;
  const filter = {
    _id: countryCodeId,
  };
  const countryCode = await countryCodeService.removeCountryCode(filter);
  return res.status(httpStatus.OK).send({ results: countryCode });
});
