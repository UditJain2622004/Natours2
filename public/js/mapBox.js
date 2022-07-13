/* eslint-disable */




export function displayMap(locations){
    mapboxgl.accessToken = 'pk.eyJ1IjoidWRpdGphaW40OSIsImEiOiJja3Jpc3U2Mm8wbTJ1MnZwZXp4d2c5OTNkIn0.rvIbqGsextrKQbICHeeJxA';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/uditjain49/ckritgrlu7nq517qy39buqmlf',
        scrollZoom:false,                                                  //zooming will be disabled
        //interactive:false            //this will disable all kind of movements on map,scrolling,zooming (map will just be a pic)
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        const el = document.createElement("div");     // create a marker element (the pin showing the loc) for each location
        el.className = "marker";                    //"marker" class is already difined in css, so it gets applied

        // new mapboxgl.Marker({                       // Creates a new mapbox marker
        //     element:el,                              // element set to the element that we creted above
        //     anchor:"Bottom"           // "bottom" means the bottom of the marker/pin icon will point to exact GPS location
        // }).setLngLat(loc.coordinates)               // set the coordinates for each marker
        //   .addTo(map);

        new mapboxgl.Marker(el)                   // Creates a new mapbox marker with the element we just created
            .setLngLat(loc.coordinates)               // set the coordinates for each marker
            .addTo(map);

        new mapboxgl.Popup({
            offset :30
        }).setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);

        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds,{                        // shows the map in a way which all markers are included
        padding:{
            top:200,
            bottom:200,
            left:100,
            right:100
        }
    });                 
}

