import axios from 'axios';
import '@babel/polyfill';

// we update data and password both with this function
// thats what the "type" parameter takes "password" or "data"
// acc. to it we decide the "url" and rest is same
export async function updateData(data,type){
    try {
        const url = (type ==="password") ? "/api/v1/users/updatePassword" : "/api/v1/users/updateMe"
        const res = await axios({
            method:"PATCH",
            url,
            data
        })
        if(res.data.status==="success"){
            location.reload(true);
        }
        
    } catch (err) {
        alert(err.response.data.message);
    }
}

// IF WE WANT TO UPDATE PASSWORD SEPARATELY     BUT ITS ALMOST SAME SO WHY WRITE IT AGAIN
// export async function updatePassword(currentPassword,newPassword,passwordConf){
//     try {
//         const res = await axios({
//             method:"PATCH",
//             url:"http://127.0.0.1:3000/api/v1/users/updatePassword",
//             data:{
//                 currentPassword,
//                 newPassword,
//                 passwordConf
//             }
//         })
//         if(res.data.status==="success"){
//             location.reload(true);
//         }
        
//     } catch (err) {
//         alert(err.response.data.message);
//     }
// }