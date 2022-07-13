/* eslint-disable prettier/prettier */
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");


const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const bookingController = require("./controllers/bookingController");
const viewRouter = require("./routes/viewRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");


const app = express();

app.enable("trust proxy");

app.set("view engine" , "pug");
app.set("views",path.join(__dirname,"views"));     //*joins the path __dirname with views folder
//* same as `${__dirname}/views`  but better bcz prevents from bugs caused by slashes(/)

// ===================================== GLOBAL MIDDLEWARES =====================================================

// *) Implementing CORS  (((((MORE ABOUT CORS AT THE END OF FILE)))))
app.use(cors());

app.options("*",cors());



// *) To serve static files
app.use(express.static(path.join(__dirname,"public")));

// *) sets some security headers   some set by default   to see others look at documentation
     // best to set as early in the code as possible
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
  
      fontSrc: ["'self'", 'https:', 'data:'],

      scriptSrc: ["'self'", 'unsafe-inline'],
  
      scriptSrc: ["'self'", 'https://*.mapbox.com','https://fonts.googleapis.com/css'],
  
      scriptSrcElem: ["'self'",'https:'],
  
      styleSrc: ["'self'", 'https:', 'unsafe-inline', 'unsafe-hashes'],
  
      connectSrc: ["'self'", 'data', 'https://*.cloudflare.com', 'ws://127.0.0.1:63406/','http://127.0.0.1:3000/api/v1/users/login/', 'ws:']
    },
  })
);
// app.use(helmet());

// this is a route for checkout sessions, we can't define it in bookingRouter bcz we need data from it in raw form ,
// not in JSON, thats why we need "express.raw" and need to define it before body-parser middleware, 
app.post("/webhook-checkout",express.raw({type:"application/json"}),bookingController.webhookCheckout);


// *) to put body of request in req.body
// if the amount of data exceeds the "limit" field, the request gets rejected
app.use(express.json({ limit :"10kb"})); // it's a middleware used as body-parser
app.use(cookieParser());

// *) a) Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// *) b) Data sanitization against XSS
app.use(xss());

// *) Prevent paramter pollution
app.use(hpp({
  whitelist:["duration","ratingsQuantity","ratingsAverage","price","maxGroupSize","difficulty"]
}))




// *) log details about the request
app.use(morgan("dev")); 


// *) To implement  ============== RATE LIMITING ==============================
// Creates a limit how many requests can be made from one IP in specified amount of time
const limiter = rateLimit({                // ratelimit() is a package called "express-rate-limit"
  max:100,                                  // max. no. of req.
  windowMs: 60*60*1000,                      // amountof time(1 hour here,  specified in milliseconds)
  message:"Too many requests from this IP, please try again in an hour!"     // message if limit is breached
})

app.use("/api",limiter)                  // applies on all routes starting with "api"

// *) Compressing the response that we send
app.use(compression());

// *) Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleString();
  // console.log(req.cookies);
  next();
});


// Setting Cors header by ourselves (instead we used "cors" npm package)

// app.all('*', function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//      );
//   res.status(200);
//     next();
//   });


  
  //  ================================== ROUTES ========================================

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);



app.all("*",(req,res,next)=>{
  // const err = new Error(`Can't find ${req.originalUrl}`);         // if not making AppError class,use this
  // err.status = 'Fail';
  // err.statusCode = 404;
  // next(err);
  
  next(new AppError(`Can't find ${req.originalUrl}`,404));
});

app.use(globalErrorHandler);                         // if don't wanna make a different file for error functions
                                       // just paste the whole function in app.use()  from errorController.js

module.exports = app;



//            CORS  ===============================

// ALLOWING ALL OVER THE APPLICATION
      //app.use(cors());

// to allow access to only spicific origin
    // app.use(cors(),{
    //   origin:"https://www.example.com"
    // })
    // this is useful when we hv our frontend and our api on different domains or subdomains

// to allow cors only on a specific route
    //app.use("/api/v1/tours",cors(), tourRouter);


// for complex requests (req. other than get and post. Also requests which send cookies) THE BROWSER initiates a 
// preflight phase.   It first does a "OPTIONS" request to check if the complex req. is safe to perform
// if our server respond with yes then browser performs the request
// so we hv to respond to the "OPTIONS" req.
//options is just another http method like get,post,delete,patch

// ALLOWING ALL OVER THE APPLICATION
    //app.options("*",cors());

//allowing complex req. on specific route
    //app.options("api/v1/tours/:id",cors());