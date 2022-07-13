const express = require("express");
const bookingRouter = require("../routes/bookingRoutes");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");


const router = express.Router();

router.post("/signup",authController.signUp);
router.post("/login",authController.logIn);
router.get("/logout",authController.logout);

router.post("/forgotPassword",authController.forgotPassword);
router.patch("/resetPassword/:token&:email",authController.resetPassword);

//todo AS middlewares are executed in sequence , to protect all the routes after a point can protected by using protect
//todo On the router
//todo Means if we do "router.use(authController.protect)" in this line, all the routes after this line will be protected

router.get("/me",authController.protect,userController.getMe,userController.getUserById);
router.patch("/updateMe",authController.protect,userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);
router.delete("/deleteMe",authController.protect,userController.deleteMe);
router.patch("/updatePassword",authController.protect,authController.updatePassword);

router.use(authController.protect,authController.restrictTo("admin"));  //*Now all routes defined after this line will
//*                                                                     be protected as well as restricted to "admin"
router                                                                  
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.use("/:userId/bookings",bookingRouter);

  module.exports = router;