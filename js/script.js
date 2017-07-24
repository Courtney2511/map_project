const MAP_API_KEY = "AIzaSyBB9SLtMMAk06MZodCNZ7MuvJ2eX2ClGWM"
const APP_ID = '1564943346912728';
const APP_SECRET = '1bcf3ad4d4708361f6988bce3ebb6d34';

var map;
// initial restaurant data
var locationData = [
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
  }
]

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

// location object constructor
var Location = function(data) {
  this.name = ko.observable(data.name),
  this.lat = ko.observable(data.lat),
  this.lng = ko.observable(data.lng)
}

// array to store markers
var markers = [];

// map initialization and display
function initMap() {
  var aurora_centre = {lat: 44.003335, lng: -79.450943 };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: aurora_centre
  });
  addMarkers(locationData);
}

function hideMarkers() {
  for (i=0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function addMarkers(locationData) {
  // info window to display content when markers are clicked
  var infoWindow = new google.maps.InfoWindow();
  // set bounds for map
  var bounds = new google.maps.LatLngBounds();
  // create markers for restaurant locations
  for (i=0; i < locationData.length; i++) {
    var marker = new google.maps.Marker({
      position: {lat: locationData[i].lat, lng: locationData[i].lng},
      map: map,
      title: locationData[i].name
    });
    markers.push(marker);
    // populateInfoWindow and center map on marker click
    marker.addListener('click', function(marker) {
      this.setAnimation(4);
      map.setCenter(marker.getPosition)
      populateInfoWindow(this, infoWindow);
    });
    // add marker position to the map bounds
    var loc = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
    bounds.extend(loc);
  }
}

  // set infowindow content to marker data and open
function populateInfoWindow(marker, infoWindow) {
  var latLng = marker.position.lat() + ',' + marker.position.lng();
  if (infoWindow.marker != marker) {
    infoWindow.setContent('');
    infoWindow.marker = marker;
    FB.api('/search?type=place&center=' + latLng + '&q=' + marker.title + '&distance=1000&fields=checkins,about,website,location,overall_star_rating,picture', {access_token: `${APP_ID}|${APP_SECRET}`}, function(response) {
    // store possible locations in an array
    var possibleLocations = response.data;
    var fbData;
    if (possibleLocations.length === 1) {
      fbData = possibleLocations[0];
    } else {
      // sort list by checkins, and return the location with the most, in the case of multiple
      // facebook pages for the location
      possibleLocations.sort(function(a, b) {
        var x = a.checkins;
        var y = b.checkins;
        return ((x < y) ? -1 : (( x > y) ? 1 : 0));
      }).reverse();
      fbData = possibleLocations[0];
    }
    infoWindow.setContent('<div><h3><a href="' + fbData.website + '">' + marker.title + '</a></h3></div><div>' + fbData.location.street + '</div><div>Rating:' + fbData.overall_star_rating + ' checkins:' + fbData.checkins + '</div><div><img src="' + fbData.picture.data.url + '"></div><div>' + fbData.about + '</div><small>resturant details provided by Facebook Places<small>');
    });
    infoWindow.open(map, marker);
  }
}

var ViewModel = function() {

  var self = this

  // observable array for restaurants
  self.restaurantList = ko.observableArray([])

  // observable array for filtered restaurants
  self.filter = ko.observable('');

  // create Location objects for each restaurant and add to restaurantList array
  locationData.forEach(function(data) {
    self.restaurantList.push(new Location(data));
  });

  //
  self.filteredRestaurants = ko.computed(function() {
    var filter = self.filter().toLowerCase();
    // by default, return the restaurantList
    if (!filter) {
        if (map) {
          hideMarkers();
        }
        return self.restaurantList();
    } else {
        hideMarkers();
        // filter restaurants for given letter sequence
        var filteredList = ko.utils.arrayFilter(self.restaurantList(), function(restaurant) {
            return restaurant.name().toLowerCase().indexOf(filter) !== -1;
        });
        console.log(convertObservablesToLocations(filteredList));
        addMarkers(convertObservablesToLocations(filteredList));
        return filteredList;
    }
}, ViewModel);
}

// convert observable instances to location object to pass to addMarker function
function convertObservablesToLocations(list) {
   return list.map(function(restaurant) {
    return {
      name: restaurant.name(),
      lat: restaurant.lat(),
      lng: restaurant.lng()
    }
  })
}

ko.applyBindings(new ViewModel())
