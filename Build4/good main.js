/*
alert(
  "Not all shootings that occur in NYC receive media attention." +
    "\n\nThis visualization gives the audience a chance to explore locations and times when shootings have been reported in NYC." +
    "\n\nIt does not attempt to provide commentary. It simply serves as a gateway to history for the viewers own curiosity and reflection."
);
*/

const myMap = L.map("map", {
  center: [40.662857, -73.969917],
  zoom: 11,
});

let MassOnly = false;
let MurderOnly = false;
let DateOnly = false;

let testlayer;
//let InitialLoadLayer;
let Rmass;
let SOL;
let MOL;
let MSOL;
let MMOL;

let controlLayers;
let overlays;
/*
controlLayers = L.control
  .layers(null, null, {
    position: "topright",
    collapsed: false,
  })
  .addTo(map);
*/

//START NO-UI SLIDER 1
//var slider = document.getElementById("slider");
/*
var slidervar = document.getElementById("slider");
noUiSlider.create(slidervar, {
  connect: true,
  start: [1, 35676000],
  range: {
    min: 1,
    max: 35676000,
  },
});
*/
//END NO-UI SLIDER 1

// BASE MAP

const basemapStreets = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
).addTo(myMap);

function MarkersFirstLoad() {
  controlLayers = L.control.layers(null, null, {
    position: "topright",
    collapsed: false,
  });

  const MassGet = $.getJSON("AllShoot.geojson", function (json) {
    //start Rmass
    let Rmass = L.geoJson(json, {
      pointToLayer: function (feature, latlng) {
        let ismurd = feature.properties.MurderF === "TRUE";
        //mass only start 1
        if (feature.properties.Mass === "TRUE") {
          //mass only end 1

          //If the count of victims doesn't appear to be duplicated
          //OR even if it's duplicated, it would be considered mass after it's corrected
          if (
            feature.properties.Deaths == 0 ||
            feature.properties.Deaths == feature.properties.Victims ||
            feature.properties.Deaths > 3
          ) {
            //if (!MurderOnly || (MurderOnly && ismurd)) {
            return L.circleMarker(latlng, {
              radius: 2.5,
              fillColor: "red",
              color: "yellow",
              weight: 0.3,
              opacity: 1,
              fillOpacity: 0.5,
            });

            /*
            if (ismurd) {
              return L.circleMarker(latlng, {
                radius: 2.5,
                fillColor: "red",
                color: "yellow",
                weight: 0.3,
                opacity: 1,
                fillOpacity: 0.5,
              });
            } else {
              return L.circleMarker(latlng, {
                radius: 2,
                fillColor: "red",
                color: "white",
                weight: 0.3,
                opacity: 1,
                fillOpacity: 0.5,
              });
            }
            */
          }

          //If the count of victims DOES appear to be duplicated
          //given the previous conditional, this also means they wouldn't be considered mass
          else {
            return L.circleMarker(latlng, {
              radius: 2.5,
              fillColor: "red",
              color: "yellow",
              weight: 0.3,
              opacity: 1,
              fillOpacity: 0.5,
              className: "blinking",
            });
            /*
            if (ismurd) {
              return L.circleMarker(latlng, {
                radius: 2.5,
                fillColor: "yellow",
                color: "red",
                weight: 0.3,
                opacity: 1,
                fillOpacity: 0.2,
              });
            } 
            else {
              return L.circleMarker(latlng, {
                radius: 2,
                fillColor: "blue",
                color: "red",
                weight: 0.3,
                opacity: 1,
                fillOpacity: 0.2,
              });
            }
            */
          }

          //mass only start 2
        }
        //mass only end 2
      },

      onEachFeature: function (feature, Rmass) {
        Rmass.bindPopup(
          "Date: " +
            feature.properties.OCCUR_DATE +
            "<br>" +
            "Time: " +
            feature.properties.OCCUR_TIME +
            "<br>" +
            "Data: " +
            feature.properties.Victims +
            " victims" +
            "<br>" +
            "Analysis: " +
            (feature.properties.Victims - feature.properties.Deaths) +
            " victims"
        );
        Rmass.on("mouseover", function (e) {
          this.openPopup();
        });
        Rmass.on("mouseout", function (e) {
          this.closePopup();
        });
      },
    });

    //cluster Start 1
    //L.markerClusterGroup.layerSupport().addTo(map).checkIn(Rmass);
    //cluster End 1
    //end Rmass

    //Rmass.addTo(myMap);
    //myMap.addControl(Rmass);
    // controlLayers.addOverlay(Rmass, "ThisIsSomething");

    sliderControl = L.control.sliderControl({
      position: "topleft",
      layer: Rmass,
      //layer: layerGroup,
      //layer: Amass,
      timeAttribute: "OCCUR_DATE",
      tracksLayer: false,
      showAllOnStart: true,
      range: true,
      rezoom: false,
    });

    myMap.addControl(sliderControl);
    //controlLayers.addOverlay(MassGet, "ThisIsSomething");

    //overlays
    /*  overlays = L.control.layers(null, null, {
      position: "topright",
      collapsed: false,
     });
 */
    //myMap.addControl(overlays);

    //  myMap.addControl(controlLayers);
    sliderControl.startSlider();
  });
}

//TOGGLE LAYERS

function ToggleMurder() {
  let hideStuff = document.querySelectorAll(".blinking");

  MurderOnly = !MurderOnly;
  hideStuff.forEach((group) => {
    if (MurderOnly) {
      group.classList.add("hide");
      //alert("unhide");
    } else {
      group.classList.remove("hide");
      //alert("hide");
    }
  });
}

/*
let tabplus = document.querySelector("#toggler");
tabplus.addEventListener("click", function () {
  if (MurderOnly) {
    alert("this is something");
  }
});
*/

MarkersFirstLoad();
