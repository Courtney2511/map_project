const MAP_API_KEY = "AIzaSyBB9SLtMMAk06MZodCNZ7MuvJ2eX2ClGWM";
const APP_ID = '1564943346912728';
const APP_SECRET = '1bcf3ad4d4708361f6988bce3ebb6d34';

// initial restaurant data
const locationData = [
  {
    name: "Fishbone",
    lat: 44.003317,
    lng: -79.451036 ,
  }, {
    name: "L'il Brew Hops",
    lat: 44.053113,
    lng: -79.457247,
  }, {
    name: "Filly & Co",
    lat: 43.991214,
    lng: -79.465786,
  }, {
    name: "Scorpion",
    lat: 44.018358,
    lng: -79.447641,
  }, {
    name: "Aw Shucks",
    lat: 43.999143,
    lng: -79.467943,
  }, {
    name: "Ground Burger Bar",
    lat: 44.052150,
    lng: -79.455617 ,
  }, {
    name: "State & Main",
    lat: 43.986688,
    lng: -79.464455,
  },
];

// Load the Facebook SDK
window.fbAsyncInit = function() {
    FB.init({
      appId            : '1564943346912728',
      autoLogAppEvents : true,
      xfbml            : true,
      version          : 'v2.9'
    });
    FB.AppEvents.logPageView();
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));


let map;

window.setTimeout(function() {
  if (!map) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = 'Server Error - Map cannot load';
    document.getElementById('map').appendChild(errorDiv);
  }
}, 3000);

// array to store markers
let markers = [];

// map initialization and display
function initMap() {
  const aurora_centre = {lat: 44.003335, lng: -79.450943 };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: aurora_centre
  });
  if (!map) {
    console.log('no map');
  }
  addMarkers(locationData);
}

function hideMarkers() {
  for (i=0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function addMarkers(locationData) {
  // info window to display content when markers are clicked
  const infoWindow = new google.maps.InfoWindow();
  // set bounds for map
  const bounds = new google.maps.LatLngBounds();

  // add animation to marker and populate infoWindow
  const markerOnClick = function(marker) {
    this.setAnimation(4);
    map.setCenter(marker.getPosition);
    populateInfoWindow(this, infoWindow);
  };
  // create markers for restaurant locations
  for (i=0; i < locationData.length; i++) {
    const marker = new google.maps.Marker({
      position: {lat: locationData[i].lat, lng: locationData[i].lng},
      map: map,
      title: locationData[i].name
    });
    markers.push(marker);
    // populateInfoWindow and center map on marker click
    marker.addListener('click', markerOnClick);
    // add marker position to the map bounds
    var loc = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
    bounds.extend(loc);
  }
}

  // set infowindow content to marker data and open
function populateInfoWindow(marker, infoWindow) {
  const latLng = marker.position.lat() + ',' + marker.position.lng();
  if (infoWindow.marker != marker) {
    infoWindow.setContent('');
    infoWindow.marker = marker;
    infoWindow.setContent('<div>Waiting for Facebook....</div>');
    FB.api('/search?type=place&center=' + latLng + '&q=' + marker.title + '&distance=1000&fields=checkins,about,website,location,overall_star_rating,picture', {access_token: `${APP_ID}|${APP_SECRET}`}, function(response) {
      // store possible locations in an array
      const possibleLocations = response.data;
      let fbData = null;
      // handle error from facebook server if applicable
      if (!response.data) {
        infoWindow.setContent('<div>Server Error - Facebook unavailable</div>');
      }
      // populate infoWindow with location data from Facebook
      if (response.data) {
        if (possibleLocations.length === 1) {
          fbData = possibleLocations[0];
          } else {
            // sort list by checkins, and return the location with the most, in the case of multiple
            // facebook pages for the location
            possibleLocations.sort(function(a, b) {
              const x = a.checkins;
              const y = b.checkins;
              return ((x < y) ? -1 : (( x > y) ? 1 : 0));
            }).reverse();
            fbData = possibleLocations[0];
          }
          infoWindow.setContent('<div><h3><a href="' + fbData.website + '">' + marker.title + '</a></h3></div><div class="address">' + fbData.location.street + '</div><div class="socail-info">Rating: <b>' + fbData.overall_star_rating + '</b> Check Ins: <b>' + fbData.checkins + '</b></div><div class="image"><img src="' + fbData.picture.data.url + '"></div><div class="about">' + fbData.about +
              '</div><small>resturant details provided by Facebook Places<small>');
      }
    });
    infoWindow.open(map, marker);
  }
}

var ViewModel = function() {

  const self = this;

  // observable array for restaurants
  self.restaurantList = ko.observableArray([]);

  // observable array for filtered restaurants
  self.filter = ko.observable('');

  // create Location objects for each restaurant and add to restaurantList array
  locationData.forEach(function(data) {
    self.restaurantList.push(new Location(data));
  });

  //
  self.filteredRestaurants = ko.computed(function() {
    let filter = self.filter().toLowerCase();
    // by default, return the restaurantList
    if (!filter) {
      hideMarkers();
        if (map) {
          addMarkers(convertObservablesToLocations(self.restaurantList()));
        }
        return self.restaurantList();
    } else {
        hideMarkers();
        // filter restaurants for given letter sequence
        let filteredList = ko.utils.arrayFilter(self.restaurantList(), function(restaurant) {
            return restaurant.name().toLowerCase().indexOf(filter) !== -1;
        });
        addMarkers(convertObservablesToLocations(filteredList));
        return filteredList;
    }
  }, ViewModel);
};

// location object constructor
var Location = function(data) {
  this.name = ko.observable(data.name);
  this.lat = ko.observable(data.lat);
  this.lng = ko.observable(data.lng);
};

// convert observable instances to location object to pass to addMarker function
function convertObservablesToLocations(list) {
   return list.map(function(restaurant) {
    return {
      name: restaurant.name(),
      lat: restaurant.lat(),
      lng: restaurant.lng()
    };
  });
}

ko.applyBindings(new ViewModel());
