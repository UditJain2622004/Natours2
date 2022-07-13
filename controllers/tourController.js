const multer = require("multer");
const sharp = require("sharp");
const Tour = require('../models/tourModels');
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");


// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//   );

  //todo =================================== MIDDLEWARE ==========================================================

// exports.checkId = (req,res,next,val)=>{               //it has 4 arg. bcz it is used in a "param" middleware
//     console.log(`Id is ${val}`);
//     const tourId = req.params.id * 1;
//     const tour = tours.find((el) => el.id === tourId); //simple js method loops over array & finds 1st matchin elements
//     if (!tour) {
//         return res.status(404).json({                // we use return so that the function ends after this
//             status: "fail",
//             message: "Invalid ID",
//         });
//         }
//         next();
// }
    
// exports.checkBody =(req,res,next)=>{
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json({
//             status:"fail",
//             message:"Missing name or price"
//         })
//     }
//     next();
    
  
// }

const multerStorage = multer.memoryStorage();


       // to allow only image files to be uploaded
const multerFilter = (req,file,callback)=>{
  if(file.mimetype.startsWith("image")){            //this has access to the "file" upoaded in the "file" argument
    callback(null,true);                   // so we check if the "mimetype" field of "file" object starts with "image"
  }else{                                              // to see whole "file" object , console.log(file)
    callback(new AppError("Not an image! Please upload an image",400),false);
  }
}

const upload = multer({                  //pass the two object created above in multer function
  storage : multerStorage,
  fileFilter : multerFilter
});


//for single image upload 
//   upload.single((nameOfField));

//for multiple image upload 
//   upload.array((nameOfField), 3);                "3" is the maxCount

/* for mix upload
//   upload.fields([
  {name:"imageCover",maxCount : 1},
  {name : "images" , maxCount : 3}
])*/

exports.uploadTourImages = upload.fields([
  {name:"imageCover",maxCount : 1},
  {name : "images" , maxCount : 3}
])

exports.resizeTourImages = async(req,res,next)=>{
  try {
    if(!req.files.imageCover || !req.files.images) return next();

    // Cover image
        //put image name into req.body.imageCover  so that we can use it in updateOne function
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000,1333)
      .toFormat("jpeg")
      .jpeg({quality:90})
      .toFile(`public/img/tours/${req.body.imageCover}`)


    // Other Images
    req.body.images = [];
    await Promise.all(                        // each "map" iteration will return a promise, so we hv to await them all
      req.files.images.map(async (file,index)=>{
        const fileName = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;

        await sharp(file.buffer)                // this "file" comes from the "map" function's 1st arg.
        .resize(2000,1333)
        .toFormat("jpeg")
        .jpeg({quality:90})
        .toFile(`public/img/tours/${fileName}`);

        req.body.images.push(fileName);           // with this we push every image fileName on req.body.images array
      })                   // which is what will be updated in updateOne function as we hv a images array in our schema
    );
    next();

  } catch (err) {
    next(err);
  }

}

  

  exports.aliasBestTours=(req,res,next)=>{     // for the "5-best-tours" route,  we autofill the query string using 
    req.query.limit = "5";                            // this middleware before going to "getAllTours" function
    req.query.sort = "-ratingsAverage,price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
    next();
  }
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
   
 

  //todo ==================================== ROUTE FUNCTIONS ====================================================
  exports.getAllTours = factory.getAll(Tour)

  

exports.getTourById = factory.getOne(Tour,{path:"reviews"});
  
  

exports.createTour = factory.createOne(Tour);



exports.updateTour = factory.updateOne(Tour);


exports.deleteTour = factory.deleteOne(Tour);
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

  //todo ======================= GEOSAPTIAL QUERIES ================================================================

  //* For tours within a specific radius 
  //* Format to write in URL
  //*/api/v1/tours/tours-within/400/center/34.111745,-118.113491/unit/km
  exports.getToursWithin = async(req,res,next)=>{
    try {
      const { distance,latlng,unit} = req.params;    //*this is destructuring   explained at end of file
      const [lat,lng] = latlng.split(",");          //* this is taking values from the URL
  
      if(!lat || !lng){
        next(new AppError("Please provide latitude and longitude in the format lat,lng.",400));
      }

      //*converting distance into radians
      const radius = unit ==="mi" ? distance/3963.2 : distance/6378.1;     //*for geospatial query ,we need to specify
  //*                                                               radius in "radians" further defined in end of file

      const tours = await Tour.find({
        startLocation:{ $geoWithin: {$centerSphere: [ [lng,lat],radius] } }  //* explained at end of file
      });
      res.status(200).json({
        status:"success",
        results:tours.length,
        data :{
          data : tours
        }
      })
      
    } catch (err) {
        next(err);
    }
  }
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

  //todo ======================= AGGREGATION PIPELINE ================================================================

  exports.getDistances = async(req,res,next)=>{
    try {
      const { latlng,unit } = req.params;
      const [lat,lng] = latlng;
 
      //*the distance calc. by aggr. will be in meteres, so to convert it into miles or km , we multiply that by this
      const multiplier = unit ==="mi" ? 0.000621371 : 0.001     

      if(!lat || !lng){
        next(new AppError("Please provide latitude and longitude in the format lat,lng.",400));
      }

      const distances = await Tour.aggregate([    //!$geoNear is the ONLY geospatial aggregation stage & it always has 
        {                                             //! to be 1st stage in the pipeline
          $geoNear :{                              //! the field to use in this should hv a GEOSPATIAL INDEX
            // key : "startLocation",
            near : {                               //*it takes the point from which distance will be calculated
              type : "Point",
              coordinates : [lng * 1, lat*1],
            },
            distanceField : "distance",           //*distance will be stored in the "distance" field of each tour

            distanceMultiplier : multiplier      //*it takes a number which will be multiplied to each distance
          }
        },
        {
          $project :{                            //* to show only "distance" and "name" field
            distance : 1,                 //*"distance" filed is created bcz we specified "distance" in "distanceField"
            name : 1                                                              //*in $geoNear stage
          }
        }
      ])

      res.status(200).json({
        status:"success",
        data : {
          data : distances
        }
      })
      
    } catch (err) {
      next(err);
    }
  }


  //??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

  //todo ======================= AGGREGATION PIPELINE ================================================================


  exports.tourStats = async(req,res,next) =>{

    try{
      const stats = await Tour.aggregate([                       // SYNTAX TO  start a aggregation pipeline 
        {
          $match : { ratingsAverage :{$gte:4.5}}                 // the "$match"  stage is like a query, this will take tours which have rating   
        },                                                                               // above or equal 4.5
        {
          $group :{                                                // "$group" stage groups element on basis of field specified in "_id" field
            _id : "$difficulty",                                         // here we hv specified difficulty, so it will make 3 groups of tours
                                                                      // 1st with difficulty "easy" 2nd with "midium" 3rd with "high"
                                                                      // After these are all fields we want as output and thier values
            numTours :{$sum:1},                                          // $sum : 1 means add 1 with each document 
            numRatings : {$sum : "$ratingsQuantity"},                     // sum of all ratingsQuantity
            avgRating : {$avg : "$ratingsAverage"},                      // avg of ratingsAverage
            avgPrice : {$avg : "$price"},
            minPrice : {$min : "$price"},
            maxPrice : {$max : "$price"}
          }
        },
        {
          $sort : { avgPrice:-1}                                   // $sort stage sorts output on basis of field given ,here field specifeid should
        }                                                // be from fields given in group stage as those are our ouptputs now,not the real doc.
                                                                       // 1 -> ascending    -1 -> descending

        // {                                                        // we can also repeat stages
        //   $match : {_id : { $ne : "easy"}}
        // }
      ]);
      res.status(200).json({
        status: "success",
        results:stats.length,
        data:{
          tours:stats
        }
      });
    }catch(err){
      next(err);
    }
  }

  exports.monthSale = async (req,res,next) =>{
    try{
      const sale = await Tour.aggregate([
        {                                             // "$unwind"  stage unwinds. as "startdates" is an array with 3 elements in each of 9 tour
          $unwind : "$startDates"             // it will unwind it and make 1 doc. for each start date ,i.e. 3 doc. of each tour,total 27 doc.
        },

        {
          $group : {                                  // then we group them on basis of month of startdate
            _id : {$month : "$startDates"},            // $month is a mongodb aggregation pipeline operator which extracts month form any date
            numTourStarts : {$sum : 1},
            tours : {$push: "$name"}               // to make an arrray of tours starting in each month
          }
        },

        {                                              // it adds a field name :"month"  its value = _id in $group stage
          $addFields : {month : "$_id"}                 // i.e.  "_id" was equal to no. of the month in which tour starts  , so it makes mor sense
        },                                            // to show it in field named "month" as it shows the month in which tour starts

        {
          $project : {_id : 0}                       // $project stage hides the field specified from output   0->hide, 1->show
        },

        {
          $sort : {numTourStarts : -1}
        },

        {
          $limit : 12                      // $limit limits no. of results , here don't hv any effect as we hv only 11 results
        }
      ])

      res.status(200).json({
        status: "success",
        results:sale.length,
        data:{
          tours:sale
        }
      });
    }catch(err){
      next(err);
    }
  }
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????




//! =====================THEORY ==========================================================================================

   //todo ===== Get One tour by id without factory function =========================================================================

  // exports.getTourById = async (req, res,next) => {
  //   try {
  //     const tour = await Tour.findById(req.params.id).populate("reviews");

  //     // if we specify an id that is valid but do not exist, still the success status with 200 code will be sent with 
  //           // tour : null   , but that is not right, we should send 404 then,   so let's do that

  //     if(!tour){
  //       return next(new AppError("No tour found with that id",404));   //  this "next()" takes it straight to global handler
  //     }

  //     res.status(200).json({
  //       status: "success",
  //       data:{
  //         tour:tour
  //       }
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // };

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


   //todo ===== Update tour without factory function =========================================================================

  // exports.updateTour = async (req, res,next) => {
  // try {

  //   const tour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
  //     new:true,                             // "new:true" return back the updated object rather than the original object
  //     runValidators:true})                  // this run the validator like schema data types and validations, so that we can't update like price
  //                                            // to a string

  //   if(!tour){
  //   return next(new AppError("No tour found with that id",404));   //  this "next()" takes it straight to global handler
  //   }

  //   res.status(200).json({
  //     status: "success",
  //     data:{
  //       tour:tour
  //     }
  //   });
    
  // } catch (err) {
  //   next(err);
  // }
  // };

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


  //todo ===== Delete tour without factory function =========================================================================

  // exports.deleteTour = async (req, res,next) => {
  //   try {
  //     const tour = await Tour.findByIdAndDelete(req.params.id);

  //     if(!tour){
  //       return next(new AppError("No tour found with that id",404));   //  this "next()" takes it straight to global handler
  //     }

  //     res.status(204).json({
  //       status: "success",
  //       data:null
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // };

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


  //todo ===== Create tour without factory function =========================================================================

 // exports.createTour = async (req, res,next) => {
  //   try {
  //     const newTour = await Tour.create(req.body);                 //this works same as   const newTour = new Tour({}) & then newTour.save()

  //   res.status(200).json({
  //     status: "success",
  //     data:{
  //       tour:newTour
  //     }
  //   });
  //   } catch (err) {
  //     // res.status(400).json({
  //     //   status:"fail",
  //     //   message:err
  //     // });
  //     next(err);                // we can use this bcz we hv the global error handler in errorController.js file,and
  //   }                                        // calling "next" with any arg. means it is an error and jumps directly to
  //                            // the global error handler    if ther is no global handler, do it as in commented lines above next(err)
  // };

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


  //todo ===== Get all tours without factory function =========================================================================


   //   exports.getAllTours = async (req, res,next) => {
//     try {
// ========================= EITHER THIS WAY ===============================================================

//   //     console.log(req.query);              // it contains the query string as object
//   //     //MONGODB METHOD
//   //     // const tours = await Tour.find(req.query);

//   //     // MONGOOSE METHOD
//   //     // const tours = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy");

//   //   // FILTERING    (just like duration=5&difficulty=easy)
//   //   const queryObj = {...req.query};                          // {...} is syntax to create a copy of an object
//   //   const excludedFields =["sort","page","fields","limit"];
//   //   excludedFields.forEach(el=>{delete queryObj[el]});         // it delete the exculded fields from queryObj


//   //   //ADVANCED FILTERING         (using operators in query like duration[lt]=5&price[lte]=1500)
//   // // when we qrite query like ?duration[lt]=5&price[lte]=1500) , req.query gives it like {duration: { lt: '5' } , price:{lte:'1500}}
//   //   // and query string in mongodb with oprators is like  {duration: { $lt: '5' } , price:{$lte:'1500}}
//   //   // so only the $ operator is missing , so we will insert that only

//   //   let queryString = JSON.stringify(queryObj);
//   //   queryString =queryString.replace(/\b(lt|lte|gt|gte)\b/g, match=> `$${match}`);  // replaces any match with $match
//   //                                                                                // i.e. lt = $lt,gt=$gt,gte=$gte,lte=$lte

//   //   let query = Tour.find(JSON.parse(queryString));

//     //SORTING
//     // if(req.query.sort){                                   // to check if url contains sort parameter
//     //   const sortBy = req.query.sort.split(",").join(" ");          // multilevel sort is written in query string using "," but sorted in mongoose
//     //   query = query.sort(sortBy);                                   // using a space " "  so we convert "," into space " "
//     // }else{query = query.sort("createdAt")}                   // even if no sorting is defined in url, we sort it by createdAT

//     //LIMITING FIELDS
//     // if(req.query.fields){
//     //   const limitBy =  req.query.fields.split(",").join(" ");
//     //   query = query.select(limitBy);
//     // }else{query = query.select("-__v")}                   // if no limit given we still hide the "__v" field

//     //PAGINATION                                   //(dividing results in pages)
//     // const page = req.query.page*1 || 1;              // (no. of page that we want)     (req.query.page*1 || 1) means either the page no. specified in url or the 1st page  
//     // const limit = req.query.limit*1 || 100;          //(no. of results on 1 page)      (req.query.limit*1 || 100) means either limit specified in url or 100 results on 1 page
//     // const skip = (page-1)*limit;                     //(used to determine how many dicuments we hv to skip)
    
//     // query = query.skip(skip).limit(limit);
//     // if(req.query.page){                                   // if we request for page which does not exist
//     //   const numberOfTours = await Tour.countDocuments();
//     //   console.log(numberOfTours);
//     //   if(skip>=numberOfTours) throw new Error("This page does not exist");
//     // }
//     // const tours = await query;

// // ====================================================================================================================

// // ============================  OR DEFINED IN apifeatures.js FILE ===================================================

//     const features = new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();
//     const tours = await features.query;   
    
// // ====================================================================================================================
                                          
//     res.status(200).json({
//       status: "success",
//       results:tours.length,
//       data:{
//         tours:tours
//       }
//     })
  
//   } catch (err) {
//     // res.status(400).json({
//     //   status:"fail",
//     //   message:err
//     // });
//     next(err);                // we can use this bcz we hv the global error handler in errorController.js file,and
//   }                                        // calling "next" with any arg. means it is an error and jumps directly to
//                            // the global error handler    if ther is no global handler, do it as in commented lines above next(err)
// };

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????




//todo ==============================THEORY ===================================================================

//TODO  Destructuring  In getToursWithin route     ===============================
//* const { distance,latlng,unit} = req.params;   is actually shorthand for :-
//* const distance = req.params.distance;
//* const latlng = req.params.latlng;
//* const unit = req.params.unit;     


//*const [lat,lng] = latlng.split(",");           is actually shorthand for :-
//*const lat = latlng.split(",")[0]
//*const lng = latlng.split(",")[1]

//TODO  Calculting radius in "radians"  In getToursWithin route     ===============================
//* const radius = unit ==="mi" ? distance/3963.2 : distance/6378.1;
//* the distance specified means the radius of circle we are looking in
//* so we need to convert the radius into "radian" to make a geospatial query

//* To convert distance into radian :
//* we need to divide it by earth's radius

//* earth's radius in miles = 3963.2   , earth's radius in km = 6378.1
//*so we distance is specified in miles, we divide it by 3963.2
//* else we divide it by 6378.1
//* for improvement we should hv checked that if "unit" is km, only then divide by 6378.1   we just assumed 
//*if it is not mile, it is in km


//TODO  Geospatial queries     ===============================
//*const tours = await Tour.find({startLocation:{ $geoWithin: {$centerSphere: [ [lng,lat],radius] } } });

//* firstly, we want to query on "startLocation" field so startlocation:
//* then "$geoWithin" is a mongoose geospatial operator to find points within a geometry
//* then "$centerSphere" means we r searching in a circle
//* "$centerSphere" takes an array of coordinates of lat. and lon. and the radius
//* the lat. and lon. are also in an array and longitude comes frst
//* radius is in "radians" which is defined above how to calculate