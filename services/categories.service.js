import { Categories } from 'models';

export async function getCategoriesById(id, options = {}) {
  const categories = await Categories.findById(id, options.projection, options);
  return categories;
}

export async function getOne(query, options = {}) {
  const categories = await Categories.findOne(query, options.projection, options);
  return categories;
}

export async function getCategoriesList(filter, options = {}) {
  const categories = await Categories.find(filter, options.projection, options);
  return categories;
}

export async function getCategoriesListWithPagination(filter, options = {}) {
  const categories = await Categories.paginate(filter, options);
  return categories;
}

export async function createCategories(body = {}) {
  const categories = await Categories.create(body);
  return categories;
}

export async function updateCategories(filter, body, options = {}) {
  const categories = await Categories.findOneAndUpdate(filter, body, options);
  return categories;
}

export async function updateManyCategories(filter, body, options = {}) {
  const categories = await Categories.updateMany(filter, body, options);
  return categories;
}

export async function removeCategories(filter) {
  const categories = await Categories.findOneAndRemove(filter);
  return categories;
}

export async function removeManyCategories(filter) {
  const categories = await Categories.deleteMany(filter);
  return categories;
}

export async function aggregateCategories(query) {
  const categories = await Categories.aggregate(query);
  return categories;
}

// export async function aggregateCategoriesWithPagination(query, options = {}) {
//   const aggregate = Categories.aggregate();
//   query.map((obj) => {
//     aggregate._pipeline.push(obj);
//   });
//   const categories = await Categories.aggregatePaginate(aggregate, options);
//   return categories;
// }
