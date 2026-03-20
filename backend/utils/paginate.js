/**
 * Shared pagination helper
 * Usage: const result = await paginate(Model, query, req.query);
 */
const paginate = async (model, filter = {}, queryParams = {}, options = {}) => {
  const page  = Math.max(1, parseInt(queryParams.page)  || 1);
  const limit = Math.min(100, parseInt(queryParams.limit) || 20);
  const skip  = (page - 1) * limit;

  const sortField = queryParams.sortBy  || options.defaultSort || "createdAt";
  const sortOrder = queryParams.order === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    model.find(filter).sort(sort).skip(skip).limit(limit),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

module.exports = paginate;
