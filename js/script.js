/*jshint esversion: 6 */

const MAP_API_KEY = "AIzaSyBB9SLtMMAk06MZodCNZ7MuvJ2eX2ClGWM";
const APP_ID = '1564943346912728';
const APP_SECRET = '1bcf3ad4d4708361f6988bce3ebb6d34';

// intital restaurant data
const initialData = [
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

// load facebook SDK
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
   js.onerror = function() {
     alert("Facebook failed to load, app functionality will be limited");
   };
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));


// displays an error if google maps fails to load
function googleError() {
  errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.innerHTML = 'Server Error - Map cannot load';
  document.getElementById('map').appendChild(errorDiv);
}

// initializes map, infowindow and location objects
function initMap() {
  const aurora_centre = {lat: 44.003335, lng: -79.450943 };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: aurora_centre
  });
  const infoWindow = new google.maps.InfoWindow({ enableEventPropagation: true });
  const locations = createLocations(initialData, map, infoWindow);
  viewModel.setRestaurantList(locations);
  // click listener for infoWindow
  function closeInfoWindow() {
    console.log('infoWindow');
    infoWindow.close();
  }
  // close infoWindow when returning to search the restaurant list
  const listDiv = document.getElementById('list-view');
  google.maps.event.addDomListener(listDiv, 'click', closeInfoWindow);

}

// creates a Location object
var Location = function(name, lat, lng, marker) {
  this.name = name;
  this.lat = lat;
  this.lng = lng;
  this.marker = marker;
};

// create a marker that can be placed on the map
function createMarker(title, position, map, infoWindow) {
  // create ther marker
  const marker = new google.maps.Marker({
    position,
    title,
    map
  });

  // create an onclick listener
  const markerOnClick = function() {
    const self = this;
    this.setAnimation(4);
    map.setCenter(this.getPosition());
    infoWindow.setContent('');
    addFacebookContentToInfoWindow(title, position.lat, position.lng, function(content) {
      infoWindow.setContent(content);
      infoWindow.open(map, self);
    });
  };

  // add the listener to the marker
  marker.addListener('click', markerOnClick);
  return marker;
}

// returns infoWindow content from Facebook
function addFacebookContentToInfoWindow(title, lat, lng, cb) {
  FB.api(`/search?type=place&center=${lat},${lng}&q=${title}&distance=1000&fields=checkins,about,website,location,overall_star_rating,picture`, {access_token: `${APP_ID}|${APP_SECRET}`}, function(response) {
    // store possible locations in an array
    const possibleLocations = response.data;
    let fbData = null;
    // handle error from facebook server if applicable
    if (!response.data) {
      cb('<div>Server Error - Facebook unavailable</div>');
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
        cb('<div><h3><a href="' + fbData.website + '">' + title + '</a></h3></div><div class="address">' + fbData.location.street + '</div><div class="socail-info">Rating: <b>' + fbData.overall_star_rating + '</b> Check Ins: <b>' + fbData.checkins + '</b></div><div class="image"><img src="' + fbData.picture.data.url + '"></div><div class="about">' + (fbData.about ? fbData.about : "no description available") +
            '</div><small>resturant details provided by Facebook Places<small>');
    }
  });
}

// returns a list of location objects
function createLocations(initialData, map, infoWindow) {
  const locations = initialData.map(data => {
    const marker = createMarker(data.name, {lat: data.lat, lng: data.lng}, map, infoWindow);
    return new Location(data.name, data.lat, data.lng, marker);
  });
  return locations;
}

function hideMarkers(locations) {
  for (i=0; i < locations.length; i++) {
    locations[i].marker.setVisible(false);
  }
}

function showMarkers(locations) {
  for (i=0; i < locations.length; i++) {
    locations[i].marker.setVisible(true);
  }
}

// triggers marker events and infoWindow to be displayed
function selectRestaurant(data) {
  toggleMenu();
  google.maps.event.trigger(data.marker, 'click');
}

// toggles restaurant list display for mobile
function toggleMenu() {
  document.getElementById('list').classList.toggle('open-menu');
}

const ViewModel = function() {

  const self = this;

  // observable array for restaurants
  self.restaurantList = ko.observableArray([]);

  // observable array for filtered restaurants
  self.filter = ko.observable('');

  // put locations in the restuarantList array
  self.setRestaurantList = function(locations) {
    locations.forEach(function(location) {
      self.restaurantList.push(location);
    });
  };

  // filter restaurantList
  self.filteredRestaurants = ko.computed(function() {
    let filter = self.filter().toLowerCase();
    // by default, return the restaurantList
    if (!filter) {
      hideMarkers(self.restaurantList());
        if (map) {
          showMarkers(self.restaurantList());
        }
      return self.restaurantList();
    } else {
      let filteredList = ko.utils.arrayFilter(self.restaurantList(), function(restaurant) {
          return restaurant.name.toLowerCase().indexOf(filter) !== -1;
      });
      hideMarkers(self.restaurantList());
      showMarkers(filteredList);
      return filteredList;
    }
  });
};

const viewModel = new ViewModel();

ko.applyBindings(viewModel);
