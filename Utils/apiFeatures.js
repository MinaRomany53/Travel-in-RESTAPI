class APIFeatures {
  constructor(query, queryRequested) {
    this.query = query;
    this.queryRequested = queryRequested; // req.query
  }

  // 1) Filtering -if user want some advanced filtering
  filter() {
    const filterQuery = JSON.stringify(this.queryRequested).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(filterQuery));
    return this;
  }

  // 2) Sorting -if user want to sort documents based on specific fields
  sort() {
    if (this.queryRequested.sort) {
      const sortBy = this.queryRequested.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createAt"); // default sort by created time from newest to oldest
    }
    return this;
  }

  // 3) Field Limiting -if user want to return specified fields in the documents
  limitFields() {
    if (this.queryRequested.fields) {
      const fields = this.queryRequested.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    }
    this.query = this.query.select({ __v: 0 }); // default not showing this field
    return this;
  }

  // 4) Pagination -divide documents into pages user-friendly
  paginate() {
    const page = this.queryRequested.page || 1;
    const limit = this.queryRequested.limit || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
