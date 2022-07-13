const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required : [true,"No name given!! Name required"],
        trim:true
    },
    email : {
        type : String,
        required : [true,"No email given!! email required"],
        unique : true,
        lowercase : true,
        validate : [validator.isEmail,"Please provide a valid email"]
    },
    photo : {
        type : String,
        default : "default.jpg"
    },
    role : {
        type : String,
        enum : ["user","guide","lead-guide","admin"],
        default : "user"
    },
    password : {
        type : String,
        required : [true,"No password given"],
        minlength : 8,
        select : false
    },
    passwordConf : {
        type : String,
        required : true,
        validate : {
            // THIS WORKS ON SAVE AND CREATE ONLY, NOT ON UPDATE
            validator : function(el){
                return el===this.password;
            },
            message : "Passwords do not match"
        }
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        dafault:true,
        select:false
    }

});

userSchema.pre("save",async function(next){
    // does not run if the password field is not modified,,   like if only email is modified ,it will not run
    if(!this.isModified("password")) return next();

        // encrypts the password
        this.password = await bcrypt.hash(this.password,12);     // "12"  is the "cost". it defines how much CPU intensive the 
        // encryption process will be. It is like the no. of salt. Defalut for this is "10". SO "12" is also fine

        // deleted the passwordConf field bcz we don't need it in our database, it is just to confirm password
        this.passwordConf = undefined;
        next();
    });

userSchema.pre("save",function(next){
    //(!this.isModified("password") checks if the the pswrd has not been modified, "this.isNew"  checks if we are saving
    // a new doc.   bcz in both cases we don't want to ser the passwordChangedAt property
    // we only set this when password is changed
    if(!this.isModified("password") || this.isNew) return next();  

    // sometimes saving in DB takes more time than issuing jwt,  that will make jwt issued before changing pswrd,which
    // will not work
    // so we reduce the "passwordChangedAt" property by 1 second to make it less than the issue time of jwt
    this.passwordChangedAt = Date.now() - 1000;            
    next();
})

userSchema.pre(/^find/,function(next){            // this is hide users whose "active" filed is set as "false"
    // "this" points to the current query
    this.find({active: {$ne:false}});  // this is a query middleware, so it applies before any query starting from "find"
    next();                                    // and finds only those users whose "active" field is not equal to false
})


// this is an INSTANCE METHOD.  It is available on all fileds of the schema
userSchema.methods.comparePassword = async function(enteredPassword,Password){
    return await bcrypt.compare(enteredPassword,Password);
}



userSchema.methods.passwordChangedAfter = function(JWTTimestamp){ // the "JWTTimestamp" contains time when token issued
    //                                we access it from "decoded" object(in file authcontroller.js)

    // if there is a "passwordChangedAt" field in the user doc., means if he has changed pswrd anytime
    if(this.passwordChangedAt){                           
// this.passwordChangedAt is in form of date & JWTTimestamp is in millisec.so we convert this.passwordChangedAt in millisec
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() /1000,10);  
        // console.log(changedTimeStamp,JWTTimestamp);   
        
//if this returns "true" means that "changedTimeStamp" is greater than "JWTTimestamp" meaning pswrd is 
//changed after issue of token. We will not give access in this situation
//if this returns "false" means that "changedTimeStamp" is less than "JWTTimestamp" meaning pswrd is 
//changed before issue of token , which is okay
        return JWTTimestamp < changedTimeStamp;            
    }

    //if there is a no "passwordChangedAt" field in the user doc., we return "false"
    // False means NOT changed
    return false;

}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.passwordResetExpires = Date.now() + (10*60*1000);
    // console.log(resetToken);
    // console.log(this.passwordResetToken);
    return resetToken;
}

const User = mongoose.model("User",userSchema);

module.exports = User;

