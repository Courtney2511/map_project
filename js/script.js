const MAP_API_KEY = "AIzaSyBB9SLtMMAk06MZodCNZ7MuvJ2eX2ClGWM"

var park = {
  name: "Sibbald Point",
  latLong: {lat: 44.3219564, lng: -79.3254315}
}

// map stuff
function initMap() {
  var ontario_centre = {lat: 45.035609, lng: -79.085021};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 7,
    center: ontario_centre
  });

  var marker = new google.maps.Marker({
    position: park.latLong,
    map: map,
    title: park.name
  });

  var contentString = "Hello"
  var infowindow = new google.maps.InfoWindow({
    content: contentString
  });

  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });
}
