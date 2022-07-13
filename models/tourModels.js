/* eslint-disable prefer-arrow-callback */
const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");

const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "No name given"],
      unique: true,
      trim: true,
      minLength: [10, "Tour name must be of at least 10 characters"],
      maxLength: [40, "Tour name must be of at most 10 characters"],
    },
    price: {
      type: Number,
      required: [true, "No price specified"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount ({VALUE}) should be less than price",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now().toString(),
      // select:false
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Ratings can not be less than 1.0"],
      max: [5, "Ratings can not be higher than 5.0"],
      set: (val) => Math.round(val * 10) / 10, //todo explained at end of file
      //*this is a setter method ,it applies after every change in value
      //*of this property . It takes a callback whose arg. is value of this pro. here "val"
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a maximum group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      trim: true,
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty can be easy,medium or difficult only",
      },
    },
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    startDates: [Date],
    slug: String,
    secretTour: { type: Boolean, default: false },

    startLocation: {
      // This is an embedded doc. for start location
      // GeoJSON                // To make an object a geospatial obj. 2 fields are necessary : "type" and "coordinates"

      type: {
        // this "type" is a field of "startLocation" object
        type: String, // this "type" is the type of that "type" field
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      // obj. for locations at which tour will stop
      {
        // it is an array of embedded GeoSpatial objects
        // GeoJSON
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // guides:Array                   //! THIS IF FOR IF WE USE EMBEDDING FOR GUIDES

    //!  FOR REFERENCING
    guides: [
      {
        type: mongoose.Schema.ObjectId, // this "type" defines that it contains mongoDB IDs
        ref: "User", // it refers to the "User" model
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

//todo Indexes========================================================================================
//* Indexes create a separate list of the indexed field in asc./desc. order
//* with that when we query for that field, mongoose doesn't have to examine all docs.
//* but "indexes" use resources, so we should be careful about which field to index.
//* 1 means asc.  -1 means desc.

toursSchema.index({ price: 1, ratingsAverage: -1 }); //*this is compound index. it works when we query both fields
//*             together as well as separately. so with comp. index, we don't hv to index those fields individually

toursSchema.index({ slug: 1 }); //*this is single field index

toursSchema.index({ startLocation: "2dsphere" }); //*"2dsphere" means when we search points on earth like sphere
//*                                             for points on a 2d plane, it is "2d"

//todo VIRTUAL PROPERTY========================================================================================
toursSchema.virtual("durationInWeeks").get(function () {
  return this.duration / 7;
});

//todo VIRTUAL POPULATE
toursSchema.virtual("reviews", {
  //?"reviews" is name of field to create virtually
  ref: "Review", //? "ref" contains reference to model from which to populate
  foreignField: "tour", //? "foreignField" conttains name of this model in the other model
  //? like tour model is ref. in "tour" field in review model so "tour" comes here

  localField: "_id", //? "localField" contains how the "tour" field of "review" model is called in this model
}); //? "tour" field of "review" model contains "id" of tour , which is called "_id" in this model
// ==========================================================================================================

//! ============================================== MIDDLEWARE ===================================================

//todo 1) DOCUMENT MIDDLEWARE                             These runs before or after  a document is processed

toursSchema.pre("save", function (next) {
  // this will run before a document is saved
  //console.log(this);                                here, "this" becomes the document which is to be saved, so it will log the doc. whic we saved
  this.slug = slugify(this.name); // like this we can create new fields for the doc. also    here, tour's slug field take value
  next(); // of its name.
});

//* THIS IS FOR EMBEDDING GUIDES INTO TOURS    THIS FUNC. BRINGS THE GUIDE DOC. INTO TOUR DOC. USING ID
// toursSchema.pre("save",async function(next){
//   const guidePromises = this.guides.map(async id=> await User.findById(id));// bcz we made "map" an async func. it will
//   //                                                                 return an array of promises
//   this.guides = await Promise.all(guidePromises);// so here we await all those promises and save result in this.guides

//   next();
// });

// eslint-disable-next-line prefer-arrow-callback
toursSchema.post("save", function (doc, next) {
  // it has access to 2 arg.  1st the saved doc. 2nd the "next" fun.
  //console.log(doc);                                    this will log the saved doc.
  // console.log("Saved!!");                           //* in this there is no "this"  bcz value of doc. is already contained
  next(); // in "doc"
});
//----------------------------------------------------------------------------------------------------------

//todo 2) QUERY MIDDLEWARE
// this executes before a query
toursSchema.pre(/^find/, function (next) {
  //*  /^find/  is regex to get all method starting from "find" so that
  this.find({ secretTour: { $ne: true } }); // it runs on findOne,findOneAndUpdate etc. also
  this.start = Date.now(); // "this" gets access to the query and we can chain a new query to it
  next(); // here we query for tours where secret is not equal to true
});

toursSchema.post(/^find/, function (docs, next) {
  // runs after the query    the "docs" arg. contains all the
  // console.log(`Query took ${Date.now() - this.start} milliseconds`);   // docs which are to come out as output
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.populate({
    // To populate the guides field
    path: "guides", // "path" takes the name of field to populate
    select: "-__v -passwordChangedAt", // ""select" shows or hide fields ,,, here hides these 2 fileds bcz of "-"
  });
  next();
});
//-----------------------------------------------------------------------------------------------------------

//todo 3) AGGREGATION MIDDLEWARE                   we hid the secret tour from query but it is still in aggregation, so we
//todo  remove it from  here also

//*here "this" refers to aggreagte object ,, this.pipeline() contains the pipeline we defined
//*as this.pipeline() is an array , we add another stage to it to match only those tours which have
//* secretTour field not equal to true
//* But as $geoNear Aggregation stage always needs to be the first stage ,we check if there is a $geoNear stage
//*in the pipeline
//*If there is we add the stage to hide secret tour to last position of pipeline
//* Otherwise we add it to first pos. of pipeline
//* unshift is a js method to add element at first position of array

toursSchema.pre("aggregate", function (next) {
  const stageOne = Object.keys(this.pipeline()[0]);
  // console.log(stageOne);
  if (stageOne[0] === "$geoNear") {
    this.pipeline().push({ $match: { secretTour: { $ne: true } } });
  } else {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }
  // console.log(this.pipeline());
  next();
});

// -----------------------------------------------------------------------------------------------------------------

// ========================================================================================================

const Tour = mongoose.model("Tour", toursSchema);

module.exports = Tour;

//todo ==========================  THEORY  ====================================================================

//TODO  set : val=>Math.round(val*10)/10    in averageRatings field
//* we want to round the avgRat. ,like 4.66667 to 4.7.
//* But Math.round roundes it to integer, like 4.66667 to 5
//* so use a trick   :
//* we multiply it to 10 making it 46.6667,   then round it making in 47 . then divide it by 10 making it 4.7

//* the "set" emthod applies after every change in value of the field. the "val" arg. contain value of the field
