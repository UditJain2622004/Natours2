const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const Booking = require("./../models/bookingModel");
const Tour = require("./../models/tourModels");
const User = require("./../models/userModel");
const factory = require("./handlerFactory");
const AppError = require("./../utils/appError");


exports.getCheckoutSession = async(req,res,next)=>{
    try {
        // 1) Get the currently booked tour
        const tour = await Tour.findById(req.params.tourId)
    
        // 2) Create a checkout session
        const session = await stripe.checkout.sessions.create({
            // method types
            payment_method_types:["card"],           
            // route to hit after success payment , we put data about booking in query string so we can create a booking
            // from it , but after creating booking we remove the query string bcz it is not secure  

            // success_url: `${req.protocol}://${req.get("host")}/?tour=${
            //     req.params.tourId
            // }&user=${req.user.id}&price=${tour.price}`,   

            // secure success url using webhooks
            success_url : `${req.protocol}://${req.get("host")}/my-tours`,
            // url to send if cancel payment            
            cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`, 
            // user's email (not compulsory)
            customer_email: req.user.email,                       
            // info. about checkout session (will be present after payment so we can put in it anything we need for creating booking)          
            client_reference_id: req.params.tourId,        

            line_items : [                           // details about product
                {                                     // one object for each product
                    name:`${tour.name} Tour`,    // the fields name "name", "description" are from stripe,we can't change
                    description : tour.summary,
                    images: [`${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`],     // this image should be a hosted image
                    amount:tour.price *100,                    // amount is in cent so multiply by 100
                    currency : "usd",
                    quantity :1
                }
            ]
        })
    
        // 3) Create session as response
        res.status(200).json({
            status:"success",
            session
        })
        
    } catch (err) {
        next(err)
    }

}

// exports.createBookingCheckout = async (req,res,next)=>{
//     try {
//         const { tour,user,price} = req.query;
//         if(!tour || !user || !price) return next();
    
//         const newBooking = await Booking.create({
//             tour,
//             user,
//             price
//         });
//         // req.originalUrl is the url where req. came from i.e.(success_url) in line 18 .   We now redirect it to 
//         // same url but without the query string bcz we don't want to show info. about booking to user
//         res.redirect(req.originalUrl.split("?")[0]);  
         
//     } catch (err) {
//         next(err);
//     }
// }

// the "session" used in this is the session object created in "getCheckoutSession" middleware
const bookingCheckoutFunction = async session =>{
    console.log(session);
    const tour = session.client_reference_id;
    const user = (await User.findOne({email:session.customer_email})).id;    // this is take only the id from the query
    const price = session.amount_total/100;
    
    await Booking.create({tour,user,price});
       
}

exports.webhookCheckout = async(req,res,next)=>{
    const signature = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature , process.env.STRIPE_WEBHOOK_SECRET)
        
    } catch (err) {                                          // this err will be recieved by  STRIPE
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }
    if(event.type === "checkout.session.completed"){
        console.log("yes");
        bookingCheckoutFunction(event.data.object);
    }

    res.status(200).json({recieved:true})

}


exports.getAllBookings = factory.getAll(Booking);

exports.getOneBooking = factory.getOne(Booking,{
    path:"tour",
    select:"name "
});

exports.createBooking = factory.createOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

exports.updateBooking = factory.updateOne(Booking);