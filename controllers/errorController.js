const AppError = require("../utils/appError");

// ==============================  TO MARK MONGOOSE ERRRORS AS OPERATIONAL   =========================================
const handleCastErrorDB = err=>{
  const message = `Invalid ${err.path} : ${err.value}`;    // create a new simple message
  return new AppError(message,400);         // pass it through AppError class to make a new error marked as operational
}

const handleDuplicateFieldsDB = err =>{
  // create a new simple message
  const message = `${Object.keys(err.keyValue)[0]} : ${Object.values(err.keyValue)[0]} already exists. Enter another ${Object.keys(err.keyValue)[0]}`;
  return new AppError(message,400);             // pass it through AppError class to make a new error marked as operational
}

const handleValidationErrorsDB = err =>{
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data!!. ${errors.join(". ")}`      // create a new simple message
  return new AppError(message,400);                // pass it through AppError class to make a new error marked as operational
}

const handleJWTError = () =>new AppError("Invalid token.Please login again",401)

const handleJWTExpiredError = () => new AppError("Your token has expired.Please log in again",401);

// ====================================================================================================================


module.exports =(err,req,res,next)=>{
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";


// ============================  FOR DEVELOPMENT ERRORS  ===========================================================
    // When in development , we want to send all details about about error so we can fix it
    if(process.env.NODE_ENV === "development"){
      // for API
      if(req.originalUrl.startsWith("/api")){
        return res.status(err.statusCode).json({
          status:err.status,
          error : err,
          message:err.message,
          stack : err.stack
        });

      // for rendered Website
      }else{
        console.error("Error 💥💥",err);
        return res.status(err.statusCode).render("error",{
          title:"Something went wrong",
          msg: err.message
        })
      }
//===================================================================================================================




// ============================  FOR PRODUCTION ERRORS  ===========================================================
    // But in production, we want to send only imp. info. to the client
    }else if (process.env.NODE_ENV === "production"){

// -----------------------------  MONGOOSE ERRORS  ------------------------------------------------------------------
      // Mongoose or mongodb errors are not markde as operational so we mark them by passing thorugh the AppError class
      let error = { ...err ,};    // make a copy of original "err" object
      error.name = err.name;      // don't know why but err.name is not copied in last line so copy that manually
      
      if(error.name === "CastError")  error = handleCastErrorDB(error);    // check for errors like invalid id
      if (error.code === 11000) error = handleDuplicateFieldsDB(error);    // check for duplicate key errors
      if (error.name === "ValidationError") error = handleValidationErrorsDB(error);  // check for validation errors
      if (error.name === "JsonWebTokenError") error = handleJWTError();  // check for JWT validation errors
      if (error.name === "TokenExpiredError") error = handleJWTExpiredError();  // check for expired JWT errors
// -------------------------------------------------------------------------------------------------------------------      

      // for API
      if(req.originalUrl.startsWith("/api")){
        // Operational error like invalid input etc. , so send message to client
        if(error.isOperational){                                                  // err.isOperational comes from the AppError
          return res.status(error.statusCode).json({                                  // class we created
            status:error.status,
            message:error.message
          });

        // Programming or other unknown error, so don't leak info. to client, just send a simple error response
        // jus log it so that we can see it and fix it
        }else{
          console.error("Error 💥💥",err);
          return res.status(500).json({
            status:"error",
            message : "Something went wrong",
          })
        }
      } else{
        // for rendered Website
          if(error.isOperational){
            return res.status(err.statusCode).render("error",{
              title:"Something went wrong",
              msg: err.message
            });

          
          }else{
            console.error("Error 💥💥",error);
            return res.status(err.statusCode).render("error",{
              title:"Something went wrong",
              msg: "Please try again later"
            })
          }
      }
    }
  
    
  };
  //===================================================================================================================