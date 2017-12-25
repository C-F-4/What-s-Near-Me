var map;
// This contains all the places
var placesInListing = new Array();
// Use this to display search suggestions
var placeNamesInListing = new Map();

// Initialize Google Maps
function initMap() {
  var centerCoordinates = {lat: 28.7041, lng: 77.1025};
  var mapProp = {
    center: new google.maps.LatLng(centerCoordinates),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,

    panControl: true,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL,
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      position: google.maps.ControlPosition.BOTTOM_LEFT
    },
    scaleControl: true,
    scaleControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    streetViewControl: true,
    overviewMapControl: true,
    styles: dark_theme
  };
  map = new google.maps.Map(document.getElementById("map"), mapProp);

  // get current location
  infoWindow = new google.maps.InfoWindow;

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // infoWindow.setPosition(currentPosition);
      // infoWindow.setContent(textMessages.location_found.message);
      // infoWindow.open(map);
      map.setCenter(currentPosition);
      addMarkerAt(map, currentPosition, {
        'message': textMessages.location_found.message,
        'event': 'mouseover'
      }, 'img/icons/current-location-marker.svg');
      searchHotspots(map, currentPosition);
    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
      // ask user to input city
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

// Ask user for the location
function handleLocationError(flag, infoWindow, mapCenter) {
  if (flag) {
    map.setCenter(mapCenter);
    searchHotspots(map, map.getCenter());
  } else {
    // show error
    console.log(errors.geolocation_failure);
  }
}

// Get user geolocation
function geocodeLatLng() {}

// Show popup about the detected location and number of nearby popular joints found
function addMarkerAt(map, coordinates, details = {}, icon) {
  var newMarker = new google.maps.Marker({
    position: coordinates,
    animation: google.maps.Animation.DROP,
    icon: icon,
    map: map,
    optimized: false
  });
  if (!isEmpty(details)) {
    newMarker['infoWindow'] = new google.maps.InfoWindow({
      content: details.message
    });
    google.maps.event.addListener(newMarker, details.event, function() {
      this['infoWindow'].open(map, this);
    });
  }
}

function searchCallback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      if (results[i].rating >= 4) {
        var place = results[i];
        var coordinates = {
          lat: results[i].geometry.location.lat(),
          lng: results[i].geometry.location.lng()
        };
        var details = {
          'message': 'Name: ' + results[i].name + '<br/> Rating: ' + results[i].rating,
          'event': 'click'
        };
        this.placesInListing.push(place);
        this.placeNamesInListing.set(place.place_id, place.name);
        addMarkerAt(map, coordinates, details);
      }
    }
  }
  console.log(this.placesInListing);
  console.log(this.placeNamesInListing);
  initializeSearchResults();
}

function searchHotspots(map, centerCoordinates) {
  var placeService = new google.maps.places.PlacesService(map);
  var request = {
    location: centerCoordinates,
    radius: '500',
    type: ['restaurant', 'cafe', 'night_club']
  };
  placeService.nearbySearch(request, searchCallback);
}

// slide in the right navbar and pop out markers on popular 5star joints
// On click of any of these markers, fetch details and load into the popup

// load map with apiKey from data.js
(function(key) {
  var url_1 = 'https://maps.googleapis.com/maps/api/js?key=',
      url_2 = '&libraries=places&callback=initMap',
      script = document.createElement('script'),
      url = '';
  if (key) {
    url = url_1 + key + url_2;
    script.setAttribute('src', url);
  }
  //load the API
  document.getElementsByTagName('head')[0].appendChild(script)
}(apiKey));

function initializeSearchResults() {
  viewModel.searchResults = ko.mapping.fromJS(this.placeNamesInListing, dataMappingOptions);
  ko.applyBindings(viewModel);
}

// KnockoutJS
var viewModel = {
  searchResults: ko.observableArray([]),
  searchQuery: ko.observable(''),

  search: function(value) {
    viewModel.searchResults.removeAll();

    // if (viewModel.searchQuery() === '') return;

    for (var data of placeNamesInListing) {
      if (data[1].toLowerCase().indexOf(viewModel.searchQuery().toLowerCase()) >= 0) {
        viewModel.searchResults.push(data[1]);
      }
    }
  }
};

dataMappingOptions = {
  'create': function(options) {
    var placesData = options.data;
    options.data = ko.observableArray([]);
    for (var places of placesData) {
      options.data.push(places[1]);
    }
    return ko.mapping.fromJS(options.data);
  }
};

viewModel.searchQuery.subscribe(viewModel.search);
