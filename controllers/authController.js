/* eslint-disable prefer-destructuring */
const crypto = require("crypto");
const util = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Email = require("../utils/email");


// THIS creates a JSON WEB TOKEN . 
//1st arg. is the "payload". It can include any inf. we want. Here we keep it simple and include id only
//2nd arg. is the secret key ================ IT SHOULD BE OF 32 CHARACTERS AT LEAST =====================
// eslint-disable-next-line arrow-body-style
const signToken = id =>{
    return jwt.sign({id : id},process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPIRES_IN})
}

const createSendToken = (user,statusCode,req,res)=>{
    const token = signToken(user._id);
    const cookieOptions = {
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 *60 *60 *1000),  // sets the expiry date of cookie to 90 days from issue
        httpOnly:true,       //  with "httpOnly :true" browser can not modify our cookie, it can just recieve it 

    }

    if (req.secure || req.headers["x-forwarded-proto"] === "https") cookieOptions.secure = true;
    // Makes a cookie , stores the token in it and send to browser
    // 1st arg. = Name to give to the cookie
    // 2nd arg. = info. to be stored in cookie
    // 3rd arg. = options for cookie
    res.cookie("jwt",token,cookieOptions);                               //and send it back with all requests


    user.password = undefined;                // This hides the password from output
    //      it does not dlete pswrd from doc. bcz we r not saving the doc. after this

    res.status(statusCode).json({
        status :"success",
        token,
        data:{
            user:user
        }
    })
    
}



exports.signUp = async (req,res,next) =>{
    try{
        const newUser = await User.create({
            name : req.body.name,
            email : req.body.email,
            password : req.body.password,
            passwordConf : req.body.passwordConf
            
        });
        const url = `${req.protocol}://${req.get("host")}/me`;
        await new Email(newUser,url).sendWelcome();

        // This is our made func. which makes a token creates a cookie and sends response
        createSendToken(newUser,201,req,res);     
        // const token = signToken(newUser._id);
        // await makeCookie(token,res);
        

        // res.status(201).json({
        //     status : "success",
        //     token,
        //     data : {
        //         User : newUser
        //     }
        // })
    }catch(err){
        next(err);
    }
}



exports.logIn = async (req,res,next)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
    //const {email,password} = req.body;   above 2 lines can be written as this also. this is called OBJECT DESTRUCTURING
        console.log(email,password);

    // 1) Check if email & password are given in request
        if(!req.body.email || !req.body.password){
            return next(new AppError("Please provide email and password",400));
        }
    // 2) Check if user exists & password is correct
        const user = await User.findOne({email:email}).select("+password");   // bcz "password" field is set "select:false"
                           // in the schema , it won't come in the output of this query, but we need it to match the pswrd
                           // so we "select" it here
                           
        
        if(!user || !(await user.comparePassword(password,user.password))) {
            return next(new AppError("Incorrect email or password!!",401));
        }
    // 3) If everything ok, send token to client

        // This is our made func. which makes a token creates a cookie and sends response
        createSendToken(user,200,req,res); 
        

    } catch (err) {
        next(err)
    }
}

exports.logout = (req,res,next)=>{
    res.cookie("jwt","loggedOut",{
        expires:new Date(Date.now() + 1000),
        httpOnly:true,
    });
    res.status(200).json({
        status:"success"
    });
}


exports.protect = async(req,res,next)=>{
    try {
        // 1)  Getting token and check if it exists ==============================================================

        // token is sent in "headers" as "authorization:Bearer (token)"
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){// so we check if their is a header 
            token = req.headers.authorization.split(" ")[1];               // named authorisation and it starts with Bearer
            // console.log(token);                       // if there is, we take the token value out without the "Bearer" word
        
        }else if(req.cookies.jwt){
            token = req.cookies.jwt;
        }                  

        if(!token){
            return next(new AppError("You are not logged in. Please log in to get access.",401));
        }


        // 2)  Verification token  ====================================================================================
        const decoded = await util.promisify(jwt.verify)(token,process.env.JWT_SECRET); // "jwt.verify" function verifies
        // console.log(decoded);                                     the token. It takes "token" and the "secret" as args.
    //it returns a "callback" so we use "util.promisify" to make it return a "promise" & save result in "decoded" object


        // 3)  Check if user still exists  ==========================================================================
        const currentUser = await User.findById(decoded.id);  // the "decoded" obejct contains the payload,& we put the 
        if(!currentUser){                               // id in payload , so we can access the id from "decoded" object
         return next(new AppError("The user belonging to this token no longer exists",401));
        }


        // 4)  Check if user changed password after JWT token was issued  ===========================================
        if(currentUser.passwordChangedAfter(decoded.iat)){               //"passwordChangedAfter" is an instance method
            return next(new AppError("User recently changed password. Please log in again",401));
        }


        // Grant access to PROTECTED ROUTE  =============================================================================
        req.user = currentUser;           // this makes available the "currentuser" on the next middlewar
         // the "req" object is what travels b/w middlewares, so we can put inf. on it which we want no next middleware
        res.locals.user = currentUser;
        next();

    } catch (err) {
        next(err);
    }
    
}


// FOR AUTHORIZATION===============================================================================================

// TO GIVE USERS WITH ONLY SPECIFIED ROLES TO PERFORM AN ACTION    like only admin and lead-guide can delete a tour
// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles)=>{                 // This helps to take argument in a middleware function
    return (req,res,next)=>{               // now "roles" is an array of args. passed in this func. in "tourRoutes" file
        //                                          // or any other file which we will use this in

// this gives the permission to perform the action to only those users whose role is specified in the func. as args.

        if(!roles.includes(req.user.role)){                // in the prev. "protect" middleware we passed user info. in
            return next(new AppError("You do not have permission to perform this action",403));// req.user. So we can 
        }                                                                                // access user role from there

        next();
    }
}
// ==================================================================================================================

exports.forgotPassword =async (req,res,next)=>{
    try {
        // 1) Get user based on email
        const user = await User.findOne({email:req.body.email});
        if(!user) return next(new AppError("There is no user with this email",404));
        
        // 2) Generate the random reset token
        const resetToken = await user.createPasswordResetToken();   // this is an instance method
                  // we hv to save user again to save reset token in database
                  // but we hv to not "run" validators again bcz otherwise it will not save without email & password
        await user.save({validateBeforeSave:false});    // "validateBeforeSave:false" does not run the validators again

        // 3) Send it to user's email

        
        
        try{
            //  await Email({                                          // tHIS func. is defined in "email.js" in utils
            //      email:user.email,
            //      subject:"Your password reset token (Valid for 10 minutes only)",
            //      message:message
            //  });
            const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}&${user.email}`;
            await new Email(user,resetUrl).sendPasswordReset();
    
             res.status(200).json({
                 status:"success",
                 message:"Token sent to email"
             });
            
        // if there was some error sending email, we should delete the token and expiry field
         }catch(err){             
             user.passwordResetToken = undefined;
             user.passwordResetExpires = undefined;
             await user.save({validateBeforeSave:false});     // save the user after deleting the token and expiry field

             return next(new AppError("There was an errror sending the email. Try again later",500));
         }




    } catch (err) {
        next(err);
    }
}


exports.resetPassword =async (req,res,next)=>{
    try{

        // 1) Get user based on token

        // the token sent to the user is the normal in "text" form  but token saved in databse is in encrypted form
        // so we encrypt ythe token coming from user to compare it with token in db
        // console.log(req.params.token);
        // console.log(req.params.email);
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    
        const user = await User.findOne({     // we make query based on 3 parameters
            email:req.params.email,                            // email
            passwordResetToken:hashedToken,                    // token that the user sent
            passwordResetExpires:{$gt:Date.now()}            // and if the token's expiry is greater than current time
            });
    
        if(!user){
            return next(new AppError("Token is invalid or expired",400));
        }
    
    
        // 2) If the token is not expired, and user exists, set the new password
        user.password = req.body.password;                              
        user.passwordConf = req.body.passwordConf;          // change password and delete the token and expiry field
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        
    
        // 3) Update changedPasswordAt property           (THIS HAPPENS THROUGH A MIDDLEWARE)
    
        // 4) Log the user in, send jwt
        // This is our made func. which makes a token creates a cookie and sends response
        createSendToken(user,200,req,res); 
        
    }catch(err){
        next(err);
    }
}

exports.updatePassword = async(req,res,next)=>{
    try {
        // 1) Get user from collection
        const user = await User.findById(req.user._id).select("+password");
        
        // 2) check if posted current password is correct
        const password = req.body.currentPassword;
        if(!(await user.comparePassword(password,user.password))){
            return next(new AppError("Wrong password",401));
        }
        // 3) If so, update the password
        user.password = req.body.newPassword;
        user.passwordConf = req.body.passwordConf;
        await user.save();

        // 4) Log user in, send JWT
        // This is our made func. which makes a token creates a cookie and sends response
        createSendToken(user,200,req,res); 
        
        
    } catch (err) {
        next(err);
    }
}



exports.isLoggedIn = async(req,res,next)=>{
    if(req.cookies.jwt){
        try {

            // 2)  Verification token  ====================================================================================
            const decoded = await util.promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET); 

            // 3)  Check if user still exists  ==========================================================================
            const currentUser = await User.findById(decoded.id);   
            if(!currentUser){
            return next();
            }

            // 4)  Check if user changed password after JWT token was issued  ===========================================
            if(currentUser.passwordChangedAfter(decoded.iat)){
                return next();
            }

             // If the code reaches here, means there is a logged in user
            res.locals.user = currentUser;
            return next();
            } catch (err) {
                console.log(err);
                return next();
        }
    }   
    next();
}