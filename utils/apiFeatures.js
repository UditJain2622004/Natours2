class APIFeatures{
    constructor(query,queryString){
      this.query = query;
      this.queryString = queryString;
    }

    filter(){
      const queryObj = {...this.queryString};                          // {...} is syntax to create a copy of an object
      const excludedFields =["sort","page","fields","limit"];
      excludedFields.forEach(el=>{delete queryObj[el]});         

      let queryStr = JSON.stringify(queryObj);
      queryStr =queryStr.replace(/\b(lt|lte|gt|gte)\b/g, match=> `$${match}`);  // replaces any match with $match
                                                                                  // i.e. lt = $lt,gt=$gt,gte=$gte,lte=$lte

      this.query = this.query.find(JSON.parse(queryStr));
      return this;
    }

    sort(){
      if(this.queryString.sort){                                   // to check if url contains sort parameter
        const sortBy = this.queryString.sort.split(",").join(" ");          // multilevel sort is written in query string using "," but sorted in mongoose
        this.query = this.query.sort(sortBy);                                   // using a space " "  so we convert "," into space " "
      }else{
        this.query = this.query.sort("_id");
      }  
      return this;
    }

    limitFields(){
      if(this.queryString.fields){
        const limitBy =  this.queryString.fields.split(",").join(" ");
        this.query = this.query.select(limitBy);
      }else{
        this.query = this.query.select("-__v");
      }
      return this;
    }

    paginate(){
      const page = this.queryString.page*1 || 1;              // (no. of page that we want)     (this.queryString.page*1 || 1) means either the page no. specified in url or the 1st page  
    const limit = this.queryString.limit*1 || 100;          //(no. of results on 1 page)      (this.queryString.limit*1 || 100) means either limit specified in url or 100 results on 1 page
    const skip = (page-1)*limit;                     //(used to determine how many dicuments we hv to skip)
    
    this.query = this.query.skip(skip).limit(limit);
    return this;
    }
  }

  module.exports = APIFeatures;