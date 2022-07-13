const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");



const router = express.Router({mergeParams:true});   //* the route "/:tourId/reviews" redirects req. from tour routes
//*                                                    to this route . But here we need value of ":tourId" param. so for
//*                                                    that we specify {mergeParams:true} in the router


//todo AS middlewares are executed in sequence , to protect all the routes after a point can protected by using protect
//todo On the router
//todo Means if we do "router.use(authController.protect)" in this line, all the routes after this line will be protected

router.use(authController.protect);       //*with this , "protect" applies on all routes defined after this line

router.route("/")
    .get(authController.protect,
        reviewController.getAllReviews)
    .post(authController.protect,
        authController.restrictTo("user"),
        reviewController.setTourUserIds,
        reviewController.createReview);

router.route("/:id")
    .get(reviewController.getReviewById)
    .delete(authController.restrictTo("user","admin"),reviewController.deleteReview)
    .patch(authController.restrictTo("user","admin"),reviewController.updateReview);


module.exports = router;