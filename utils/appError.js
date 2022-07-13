class AppError extends Error {
    constructor(message,statusCode){
        super(message);

        this.statusCode =statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail":"error";
        this.isOperational = true;                     // To check if the error is an operaitonal error
                                                       // bcz we only use this class for operational errors
        Error.captureStackTrace(this,this.constructor);    // used to do something with the error stack that comes 
    }                                                        // like which tells us the line column of where  error occured
}                                                       // try logging "err.stack" in the error handler in app.js

module.exports = AppError;