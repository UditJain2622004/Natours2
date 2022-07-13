/* eslint-disable */
import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from "./alerts";


export async function login(email,password){
    
    try {
        const res = await axios({
            method:"POST",
            url:"/api/v1/users/login",
            data:{
                email:email,
                password:password
            }
        });
        if(res.data.status === "success"){
            // showAlert("success","Logged in successfully");
            // setTimeout(()=>{
            //     location.assign("/");
            // },1000)
            location.assign("/");
        }
    } catch (err) {
        alert(err.response.data.message);
    }
    
}


export async function logout(){
    try {
        const res = await axios({
            method:"GET",
            url: "/api/v1/users/logout"
        });

        if(res.data.status === "success"){
            location.assign("/");
        }
    } catch (err) {
        console.log(err.response.data.message);
    }
}



// const res = await fetch("http://127.0.0.1:3000/api/v1/users/login", {
      
//     // Adding method type
//     method: "POST",
//     mode:"no-cors",
//     cache:"no-cache",
//     credentials:"same-origin",
//     redirect:"follow",
//     referrerPolicy:"no-referrer",
//     // Adding body or contents to send
//     body: {
//         email:email,
//         password:password
//     },
      
//     // Adding headers to the request
//     headers: {
//         "Content-type": "application/json; charset=UTF-8"
//     }
// })
// .then(console.log("finalyyy..................."))
  
// // Converting to JSON
// .then(response => response.json())
  
// // Displaying results to console
// .then(json => console.log(json));