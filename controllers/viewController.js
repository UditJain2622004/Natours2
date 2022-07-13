const Tour = require("../models/tourModels");
const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");



exports.getOverview = async(req,res,next)=>{
    try {
        //1) Get tour data from collection
        const tours = await Tour.find();
        //2) Build the template
    
        //3) Render the template
        res.status(200).render("overview",{
            title : "All Tours",
            tours
        });

    } catch (err) {
        next(err);
    }
}

exports.getTour = async(req,res,next)=>{
    try {
        const tour = await Tour.findOne({slug:req.params.slug}).populate({
            path:"reviews",
            select:"review rating user"
        });

        if(!tour){
            return next(new AppError("There is no tour with that name",404));
        }

        res.status(200).set(
            "Content-Security-Policy",
            "default-src 'self' https: ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
        //    "Set-Cookie",
        //    "Secure;SameSite=None"s
            
        ).render("tour",{
            title : tour.name,
            tour
        });
        
    } catch (err) {
        next(err);
    }
}
    
exports.login = async (req,res,next)=>{
    try {
        res.status(200).set(
            "Content-Security-Policy",
            "script-src-elem 'self' https:",
            // "Content-Security-Policy",
            // "connect-src 'self'"
        ).render("login",{
            title:"Log In"
        });
    } catch (err) {
        next(err);
    }
}

// .set(
//     "Content-Security-Policy",
//     "script-src-elem  https://*.cloudflare.com http://localhost:3000/js/login.js")



exports.getAccount = (req,res)=>{
    res.status(200).render("account",{
        title:"Your Account"
    })
}


exports.getMyTours = async(req,res,next)=>{
    try {
        // 1) Find all bookings
        const bookings = await Booking.find({user:req.user.id});

        // 2) Find tours with returned ids
        const tourIds = bookings.map(el=>el.tour);                  // makes an array with tour Ids of all bookings

        // "$in" operator means finds tours for all Ids that are in tourIds array 
        const tours = await Tour.find({_id : {$in : tourIds}});       
        res.status(200).render("overview",{
            title : "My Tours",
            tours
        })
        
    } catch (err) {
        next(err);
    }
}