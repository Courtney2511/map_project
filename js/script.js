const MAP_API_KEY = "AIzaSyBB9SLtMMAk06MZodCNZ7MuvJ2eX2ClGWM"

// initial park data
var initialParks = [
  {
    name: "Sibbald Point",
    address: "26071 Park Rd, Jacksons Point",
    lat: 44.3219564,
    lng: -79.3254315,
    infoContent: "content belongs here"
  }, {
    name: "Awenda",
    address: "670 Awenda Park Rd, Tiny",
    lat: 44.846409,
    lng: -79.998677,
    infoContent: "content belongs here"
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
  this.address = ko.observable(data.address),
  this.lat = ko.observable(data.lat),
  this.lng = ko.observable(data.lng),
  this.infoContent = ko.observable(data.infoContent)
}

// array to store markers
var markers = [];

// map initialization and display
function initMap() {
  var ontario_centre = {lat: 45.035609, lng: -79.085021};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 7,
    center: ontario_centre
  });

  // info window to display content when markers are clicked
  var infoWindow = new google.maps.InfoWindow();

  // create markers for park locations
  for (i=0; i < initialParks.length; i++) {
    var marker = new google.maps.Marker({
      position: {lat: initialParks[i].lat, lng: initialParks[i].lng},
      map: map,
      title: initialParks[i].name
    });
    markers.push(marker);
    // marker.addListener('mouseover', function() {
    //   marker.setAnimation(google.maps.Animation.BOUNCE);
    // });
    // populateInfoWindow on marker click
    marker.addListener('click', function(marker) {
      this.setAnimation(4);
      populateInfoWindow(this, infoWindow);
    });
  }
}

  // set infowindow content to marker data and open
function populateInfoWindow(marker, infoWindow) {
  var app_id = '1564943346912728';
  var app_secret = '1bcf3ad4d4708361f6988bce3ebb6d34';
  if (infoWindow.marker != marker) {
    infoWindow.setContent('');
    infoWindow.marker = marker;
    infoWindow.setContent('<div>' + marker.title + '</div>');
    FB.api('/113124472034820', {access_token: `${app_id}|${app_secret}`}, function(response) {
    console.log(response);
    });
    infoWindow.open(map, marker);
  }
}

var ViewModel = function() {

  var self = this

  // observable array for parks
  this.parkList = ko.observableArray([])

  // create Location objects for each park and add to parkList array
  initialParks.forEach(function(data) {
    self.parkList.push(new Location(data));
  });
}

ko.applyBindings(new ViewModel())
