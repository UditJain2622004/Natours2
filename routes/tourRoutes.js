const express = require("express");
const reviewRouter = require("./reviewRoutes");
const bookingRouter = require("./bookingRoutes");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");

const router = express.Router();


// router.param("id",tourController.checkId);             //this is "param middleware" . It only runs when the URL has the 
                                                     // specified resource, in this case "id". 

router
    .route("/5-best-tours")
    .get(tourController.aliasBestTours,tourController.getAllTours)   // goes through a middleware "aliasBestTours" before
                                                    // going to getAllTours function

router.route("/tour-stats")
   .get(tourController.tourStats);

router.route("/monthSale")
   .get(authController.protect,
      authController.restrictTo("admin","lead-guide","guide"),
      tourController.monthSale);

router
   .route("/tours-within/:distance/center/:latlng/unit/:unit")
   .get(tourController.getToursWithin);

router
      .route("/distances/:latlng/unit/:unit")
      .get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(authController.protect,
      authController.restrictTo("admin","lead-guide"),
      tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTourById)
  .patch( authController.protect,
      authController.restrictTo("admin","lead-guide"),
      tourController.uploadTourImages,
      tourController.resizeTourImages,
      tourController.updateTour)
  .delete(
     authController.protect,
     authController.restrictTo("admin","lead-guide"),
     tourController.deleteTour);

// router
//    .route("/:tourId/reviews")
//    .post(authController.protect,authController.restrictTo("user"),reviewController.createReview)

router.use("/:tourId/reviews",reviewRouter);   //? we use this instead of above implementation bcz it is not good to use
//?                                            reviewController in tourRoutes
//?                                            here this will use reviewRouter for any request coming on this URL

router.use("/:tourId/bookings",bookingRouter);

  module.exports = router;