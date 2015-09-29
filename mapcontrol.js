// Wrapper for the leaflet.js map control with methods
// to manage the map layers.
function createMapControl(elementName) {
    'use strict';

    // Private methods for drawing turn point sectors and start / finish lines

    function getBearing(pt1, pt2) {
        // Get bearing from pt1 to pt2 in degrees
        // Formula from: http://www.movable-type.co.uk/scripts/latlong.html
        // Start by converting to radians.
        var degToRad = Math.PI / 180.0;
        var lat1 = pt1[0] * degToRad;
        var lon1 = pt1[1] * degToRad;
        var lat2 = pt2[0] * degToRad;
        var lon2 = pt2[1] * degToRad;

        var y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        var x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

        var bearing = Math.atan2(y, x) / degToRad;
        bearing = (bearing + 360.0) % 360.0;
        return bearing;
    }

    function getLine(pt1, pt2, linerad, drawOptions) {
        //returns line through pt1, at right angles to line between pt1 and pt2, length linerad.
        //Use Pythogoras- accurate enough on this scale
        var latdiff = pt2[0] - pt1[0];
        //need radians for cosine function
        var northmean = (pt1[0] + pt2[0]) * Math.PI / 360;
        var startrads = pt1[0] * Math.PI / 180;
        var longdiff = (pt1[1] - pt2[1]) * Math.cos(northmean);
        var hypotenuse = Math.sqrt(latdiff * latdiff + longdiff * longdiff);
        //assume earth is a sphere circumference 40030 Km 
        var latdelta = linerad * longdiff / hypotenuse / 111.1949269;
        var longdelta = linerad * latdiff / hypotenuse / 111.1949269 / Math.cos(startrads);
        var linestart = new L.LatLng(pt1[0] - latdelta, pt1[1] - longdelta);
        var lineend = new L.LatLng(pt1[0] + latdelta, longdelta + pt1[1]);
        var polylinePoints = [linestart, lineend];
        var polylineOptions = {
            color: 'green',
            weight: 3,
            opacity: 0.8
        };

        return new L.Polyline(polylinePoints, drawOptions);
    }

    function getTpSector(centrept, pt1, pt2, sectorRadius, sectorAngle, drawOptions) {
        var headingIn = getBearing(pt1, centrept);
        var bearingOut = getBearing(pt2, centrept);
        var bisector = headingIn + (bearingOut - headingIn) / 2;

        if (Math.abs(bearingOut - headingIn) > 180) {
            bisector = (bisector + 180) % 360;
        }

        var beginangle = bisector - sectorAngle / 2;

        if (beginangle < 0) {
            beginangle += 360;
        }

        var endangle = (bisector + sectorAngle / 2) % 360;
        var sectorOptions = jQuery.extend({}, drawOptions, { startAngle: beginangle, stopAngle: endangle });
        return L.circle(centrept, sectorRadius, sectorOptions);
    }

    // End of private methods

    var map = L.map(elementName);

    var mapQuestAttribution = ' | Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">';
    var mapLayers = {
        openStreetMap: L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>' +
                         mapQuestAttribution,
            maxZoom: 18
        }),

        photo: L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
            attribution: 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency' +
                         mapQuestAttribution,
            maxZoom: 11
        })
    };

    var layersControl = L.control.layers({
        'MapQuest OpenStreetMap': mapLayers.openStreetMap,
        'MapQuest Open Aerial (Photo)': mapLayers.photo
    });

    mapLayers.openStreetMap.addTo(map);
    layersControl.addTo(map);

    var trackLatLong = [];
    var timePositionMarker;
    L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
    var planeIcon = L.AwesomeMarkers.icon({
        icon: 'plane',
        iconColor: 'white',
        markerColor: 'red'
    });
    
    return {
        reset: function () {
            // Clear any existing track data so that a new file can be loaded.
            if (mapLayers.track) {
                map.removeLayer(mapLayers.track);
                layersControl.removeLayer(mapLayers.track);
            }

            if (mapLayers.task) {
                map.removeLayer(mapLayers.task);
                layersControl.removeLayer(mapLayers.task);
            }
        },

 zapAirspace: function()  {if (mapLayers.airspace) {
                map.removeLayer(mapLayers.airspace);
                layersControl.removeLayer(mapLayers.airspace);
            }
 },
        
 addAirspace: function(airdata,clip) {
var i;
var polyPoints;
var airStyle = {
    "color": "black",
    "weight": 1,
    "opacity": 0.20,
    "fillColor": "red",
    "smoothFactor": 0.1
};
var j=0;
var suafeatures=[];
this.zapAirspace();
for(i=0 ; i < airdata.length;i++) {
       if(airdata[i].base < clip)  {
            switch(airdata[i].shape)  {
                case "polygon":
                  polyPoints=airdata[i].coords;
                  suafeatures[j++] =  L.polygon(polyPoints,airStyle);
                 break;
                case "circle":
                   suafeatures[j++] =new  L.Circle(airdata[i].centre, airdata[i].radius, airStyle);
                  break;
          }
       }
}
         mapLayers.airspace = L.layerGroup(suafeatures).addTo(map); 
         layersControl.addOverlay(mapLayers.airspace, 'Airspace');
        },
                     
        addTrack: function (latLong) {
            trackLatLong = latLong;
            var trackLine = L.polyline(latLong, { color: 'red' });
            timePositionMarker = L.marker(latLong[0], { icon: planeIcon });
            mapLayers.track = L.layerGroup([
                trackLine,
                timePositionMarker
            ]).addTo(map);
            layersControl.addOverlay(mapLayers.track, 'Flight path');

            map.fitBounds(trackLine.getBounds());
        },

        zapTask: function()  {
            if (mapLayers.task) {
                map.removeLayer(mapLayers.task);
                layersControl.removeLayer(mapLayers.task);
            }
        },
        
       addTask: function (coordinates, names) {
            //Clearer if we don't show track to and from start line and finish line, as we are going to show lines
            var taskLayers = [L.polyline(coordinates, { color: 'blue' })];
            var taskDrawOptions = {
                color: 'green',
                weight: 3,
                opacity: 0.2
            };
            //definitions from BGA rules
            //defined here as any future changes will be easier
            var startLineRadius = 5;
            var finishLineRadius = 1;
            var tpCircleRadius = 500;
            var tpSectorRadius = 20000;
            var tpSectorAngle = 90;
            var j;
            for (j = 0; j < coordinates.length; j++) {
                taskLayers.push(L.marker(coordinates[j]).bindPopup(names[j]));
                switch (j) {
                    case 0:
                        var startline = getLine(coordinates[0], coordinates[1], startLineRadius, taskDrawOptions);
                        taskLayers.push(startline);
                        break;
                    case (coordinates.length - 1):
                        var finishline = getLine(coordinates[j], coordinates[j - 1], finishLineRadius, taskDrawOptions);
                        taskLayers.push(finishline);
                        break;
                    default:
                        taskLayers.push(L.circle(coordinates[j], tpCircleRadius, taskDrawOptions));
                        var tpsector = getTpSector(coordinates[j], coordinates[j - 1], coordinates[j + 1], tpSectorRadius, tpSectorAngle, taskDrawOptions);
                        taskLayers.push(tpsector);
                }
            }
            mapLayers.task = L.layerGroup(taskLayers).addTo(map);
            layersControl.addOverlay(mapLayers.task, 'Task');
        },
        
        setTimeMarker: function (timeIndex) {
            var markerLatLng = trackLatLong[timeIndex];
            if (markerLatLng) {
                timePositionMarker.setLatLng(markerLatLng);
                
                if (!map.getBounds().contains(markerLatLng)) {
                    map.panTo(markerLatLng);
                }
            }
        }
    };
}




