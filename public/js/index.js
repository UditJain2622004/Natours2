import { login,logout } from "./login";
import { updateData,updatePassword } from "./update";
import { displayMap } from "./mapBox";
import { bookTour } from "./stripe";

//* we put he locations data into "data-locations" attribute
//* anything stored into a data attribute get stored into the dataset property
//* and bcz we specified data-locations, we can access it with .dataset.locations

const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logoutButton = document.querySelector(".nav__el--logout");
const saveSettings = document.querySelector(".form-user-data")
const updatePswrdBtn = document.querySelector(".form-user-settings")
const bookButton = document.getElementById("book-tour")

if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}


if(loginForm){
    loginForm.addEventListener("submit",e=>{
        e.preventDefault();
        const email =  document.getElementById("email").value;
        const password =  document.getElementById("password").value;
        // console.log(email,password);
        login(email,password);
    })

}

if(logoutButton){
    logoutButton.addEventListener("click",logout)
}

if(saveSettings){
    saveSettings.addEventListener("submit",function(e){
        e.preventDefault();
        const form = new FormData();                                  // we need to do this bcz we r sending a photo
        form.append("name",document.querySelector("#name").value);
        form.append("email",document.querySelector("#email").value);
        form.append("photo",document.querySelector("#photo").files[0]);
        
        updateData(form,"data");
        
    })
}
if(updatePswrdBtn){
    updatePswrdBtn.addEventListener("submit",async function(e){
        e.preventDefault();
        document.querySelector(".btn--save-password").textContent = "Updating...";

        const currentPassword = document.querySelector("#password-current").value;
        const newPassword = document.querySelector("#password").value;
        const passwordConf = document.querySelector("#password-confirm").value;

        await updateData({currentPassword,newPassword,passwordConf},"password");
        
        document.querySelector(".btn--save-password").textContent = "Save Password";
        document.querySelector("#password-current").value = '';
        document.querySelector("#password").value='';
        document.querySelector("#password-confirm").value = '';
    })
}

if(bookButton){
    bookButton.addEventListener("click",e=>{
        e.target.textContent = "Processing";                // e.target means the element that triggered the event
        const tourId = e.target.dataset.tourId;             // i.e. the bookButton
        bookTour(tourId);
    })
}