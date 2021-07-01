class APIFeatures {

  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
  }//constructor


  filter() {
    const queryObject = { ...this.queryString }

    const excludedFeilds = ['page', 'sort', 'limit', 'fields']
    
    excludedFeilds.forEach(el => {
      delete queryObject[el]
    })

    let queryStr = JSON.stringify(queryObject)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

    this.query = this.query.find(JSON.parse(queryStr))

    return this
  } //filter


  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    }
    else
      this.query = this.query.sort('-createdAt')
    return this
  }//sorting

  limitFields() {
    if (this.queryString.fields)
      this.query = this.query.select(this.queryString.fields.split(',').join(' '))
    else this.query = this.query.select('-__v')
    return this

  }//limiting


  paginate() {

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit)

    return this

  }//limit&paging


}//class

module.exports = APIFeatures;