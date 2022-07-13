import axios from "axios";
const stripe = Stripe("pk_test_51JOGaWSJ8dmohuaU2yqd4K4NsUbX0vv34INOK7qYkwpJPPfnGqlINj1QKLuKJoAxyYNSWRVng9IZEFhcSRd5A7TV000qfN8gQN")

export const bookTour = async tourId =>{
    try {
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        // console.log(session);
    
        // 2) Create checkout form and charge credit card
        await stripe.redirectToCheckout({
            sessionId : session.data.session.id
        })
        
    } catch (err) {
        console.log(err);
        alert(err)
    }
}