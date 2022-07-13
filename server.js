const mongoose = require("mongoose");
const dotenv = require("dotenv");

// For handling errors outside express from synchronous code
// Synchronous code errors emits uncaughtException event , so we can cathc them using that
process.on("uncaughtException",err=>{
  console.log("Unhandled Exception!! Shutting down...");   // this has to be dfined on top of file, if defined after any
  console.log(err.name,err.message);                       // synch. code ,it won't work for that code
  console.log(err);                       // synch. code ,it won't work for that code
  process.exit(1);
});



dotenv.config({path: "./config.env"});   //It need to be configured before requiring "app.js"

const DB = process.env.DATABASE.replace("<PASSWORD>",process.env.DATABASE_PASSWORD);

// For local connection
// mongoose.connect(process.env.DATABASE_LOCAL,{useNewUrlParser:true,useCreateIndex:true,useUnifiedTopology:true,useFindAndModify:false}).then(()=>console.log("Database connection established"));

//For hosted connection
mongoose.connect(DB,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useUnifiedTopology:true,
  useFindAndModify:false}).then(()=>console.log("Database connection established"));
                     // mongoose.connect returnss a promise so we can use .then on it


const app = require("./app");

const server = app.listen(process.env.PORT, () => {
    console.log("Server started on port 3000");
  });



// For handling errors outside express from asynchronous code
// aSynchronous code errors emits unhandledRejection event , so we can catch them using that
process.on("unhandledRejection",err=>{
  console.log("Unhandled rejection!! Shutting down...");
  console.log(err.name,err.message);
  server.close(()=>{
    process.exit(1);
  });
})

process.on("SIGTERM",()=>{
  console.log("SIGTERM recieved! Shutting down");
  server.close(()=>{
    console.log("Process terminated");
  })
})