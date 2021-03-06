const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");


//?This is to set Tour and User ids from the URL when creating review   (it is used in get "create" route)
exports.setTourUserIds = (req,res,next)=>{
    if(!req.body.tour) req.body.tour = req.params.tourId;          //* to take the tour ID from URL
    if(!req.body.user) req.body.user = req.user._id;              //* to take user ID of currently logged in user
    next();                                //*we can use req.user._id bcz we put user in req.user in protect middleware
}
//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????




exports.getReviewById = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????



//todo ===== Get all reviews without factory function ==========================================================================
// exports.getAllReviews = async(req,res,next) =>{
//     try {
//         let filter = {};
//         if(req.params.tourId) filter = {tour:req.params.tourId};
//         const reviews = await Review.find(filter);


//         if(!reviews) return next(new AppError("No review found"));
    
//         res.status(200).json({
//             status : "success",
//             results : reviews.length,
//             data : {
//                 reviews
//             }
//         })
        
//     } catch (err) {
//         next(err);
//     }
// }

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


//todo ==== Create review without factory function ====================================================================
// exports.createReview = async(req,res,next)=>{
//     try {
//         if(!req.body.tour) req.body.tour = req.params.tourId;          //* to take the tour ID from URL
//         if(!req.body.user) req.body.user = req.user._id;               //* to take user ID of currently logged in user
//         //*                                         we can use req.user._id bcz we put user in req.user in protect middleware
//         const review = await Review.create(req.body);

//         res.status(201).json({
//             status : "success",
//             data :{
//                 review
//             }
//         })
        
//     } catch (err) {
//         next(err);
//     }
// }

//??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????




