const mongoose= require("mongoose");
const Tour = require("./tourModels");


const reviewSchema = new mongoose.Schema({
    review : {
        type : String,
        required: [true, "Review can not be empty"]
    },
    rating : {
        type : Number,
        max : 5,
        min : 1
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    tour:{
        type : mongoose.Schema.ObjectId,
        ref : "Tour",
        required : [true,"Review must belong to a Tour"]

    },
    user:{
        type : mongoose.Schema.ObjectId,
        ref : "User",
        required : [true,"Review must belong to a User"]
    }
},
{
    toJSON: {virtuals:true},
    toObject:{virtuals:true},
    id: false
  }
);
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
//todo  ============================= Indexing ======================================================================
reviewSchema.index({tour:1,user:1},{unique:true}); //*this makes an index with user and tour field so that on one tour
//*                                                   there can be only one review by one user
//* this happens bcz of {unique:true} . it means there can be only one combination of a tour and a user
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

reviewSchema.pre(/^find/,function(next){
//     this.populate({                         
//     path:"tour",                       //* this is to populate tour and user
//     select : "-guides name"            //* but we don't need "tour" populated every time
//   }).populate({                        //* also it create a chain of populate when we populate tour with review
//       path:"user",                  //* as first tour gets populated with review, then review get populated with tour
//       select :"name photo"           //* which is not necessary
//   });
this.populate({
      path:"user",
      select :"name photo"
  });
  next();
})
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

//todo This is a STATIC method
//todo these are called on the "model" and the "this" keyword points to current model
//todo we use this method in a post middleware which runs after every review creation

reviewSchema.statics.calcAverageRatings =async function(tourId){//*we used "static" method bcz we need to call the
    const stats = await this.aggregate([                       //* "aggregate" function on Model, and in static func.
        {                                                    //*"this" points to the Model
            $match : {tour:tourId}                 //* matches all the reviews with "tour" field = tourId(given as arg.)
        },
        {
            $group : {
                _id : "$tour",
                nRating : {$sum:1},                    
                avgRating : {$avg:"$rating"}
            }
        }
    ]);
    // console.log(stats);
    if(stats.length>0){
        await Tour.findByIdAndUpdate(tourId,{             //*update data in Tour model
            ratingsAverage:stats[0].avgRating,           
            ratingsQuantity:stats[0].nRating
        })
    }else{
        await Tour.findByIdAndUpdate(tourId,{             //*update data in Tour model
            ratingsAverage:4.5,           
            ratingsQuantity:0
        });
    }
}




//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

reviewSchema.post("save",function(){               //*this is a middleware, so "this" points to the current doc.
    this.constructor.calcAverageRatings(this.tour);    //*but "statics" method is always called on the "Model"
                                    //* so we use "this.constructor" which points to "model" of the current doc.
})                                      
//*"post" middleware don't have "next()"
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

//todo To update review stats on Updating and Deleting reviews
reviewSchema.pre(/^findOneAnd/,async function(next){        //*as updating and deleting happens with a query,we can only
    this.r = await this.findOne();                      //*use a "query" midddleware, But in this we don't hv access to 
    next();                                         //*the model . Here "this" points to the current query
});                                         //*so we make another query on it to get review doc. and save it in "this.r"
//*                            we can't save it in any constant bcz we will need it in "post" middleware


reviewSchema.post(/^findOneAnd/,async function(){               //*we saved the review doc. in "this.r" in "pre" midware
    await this.r.constructor.calcAverageRatings(this.r.tour);   //*so "this.r.constructor" points to the review Model
})//*                                     and we use "calcAverageRatings" method on that ,we get tourId by "this.r.tour"

//todo we need the pre MW to get doc. from the query bcz query is not present till the post MW
//todo and we need the post MW bcz we need to call calcAverageRatings method after updating or deleting the doc.
//todo we update or delete doc. using findByIdAndUpdate/Delete which behind scenes use findOneAndUpdate/Delete, so we 
//todo use /^findOneAnd/ which is a regex meaning starting from findOneAnd.
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

const Review = mongoose.model("Review",reviewSchema);


module.exports = Review;