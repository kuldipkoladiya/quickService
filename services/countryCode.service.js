import { CountryCode } from 'models';

export async function getCountryCodeById(id, options = {}) {
  const countryCode = await CountryCode.findById(id, options.projection, options);
  return countryCode;
}

export async function getOne(query, options = {}) {
  const countryCode = await CountryCode.findOne(query, options.projection, options);
  return countryCode;
}

export async function getCountryCodeList(filter, options = {}) {
  const countryCode = await CountryCode.find(filter, options.projection, options);
  return countryCode;
}

export async function getCountryCodeListWithPagination(filter, options = {}) {
  const countryCode = await CountryCode.paginate(filter, options);
  return countryCode;
}

export async function createCountryCode(body = {}) {
  const countryCode = await CountryCode.create(body);
  return countryCode;
}

export async function updateCountryCode(filter, body, options = {}) {
  const countryCode = await CountryCode.findOneAndUpdate(filter, body, options);
  return countryCode;
}

export async function updateManyCountryCode(filter, body, options = {}) {
  const countryCode = await CountryCode.updateMany(filter, body, options);
  return countryCode;
}

export async function removeCountryCode(filter) {
  const countryCode = await CountryCode.findOneAndRemove(filter);
  return countryCode;
}

export async function removeManyCountryCode(filter) {
  const countryCode = await CountryCode.deleteMany(filter);
  return countryCode;
}
