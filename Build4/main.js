//START
//FROM
//TOP
history.scrollRestoration = "manual";
//END
//FROM
//TOP

//START
//PAGE
//WAIT

const preloader = document.querySelector(".preloader");
const postload = document.querySelector(".postload");
const thebody = document.querySelector("body");
preloader.style.transform = "scale(1)";
const fadeOutEffect = setInterval(() => {
  if (!preloader.style.opacity) {
    preloader.style.opacity = 1;
    //preloader.style.setProperty("background-size", "100vw 100vh");
    //  postload.style.opacity = 0;
  }
  if (preloader.style.opacity > 0) {
    preloader.style.opacity -= 0.1;
    postload.style.display = "in";
    //postload.style.opacity += 0.1;
  } else {
    clearInterval(fadeOutEffect);
    //preloader.style.display = "none";
    preloader.remove();
    postload.style.opacity = 1;
    thebody.style.setProperty("overflow-y", "unset");
    postload.style.pointerEvents = "auto";
  }
}, 300);

window.addEventListener("load", () => fadeOutEffect);
//END
//PAGE
//WAIT

//START
//CALENDAR
//HEATMAP

let vh = window.innerHeight;
let vw = window.innerWidth;

const weekDaysTemplate = (DateHelper) => ({
  name: "weekday",
  parent: "day",
  //rowsCount: () => 7,
  //columnsCount: () => 28,
  mapping: (startTimestamp, endTimestamp) => {
    let weekNumber = 0;
    let x = -1;

    return DateHelper.intervals(
      "day",
      startTimestamp,
      DateHelper.date(endTimestamp)
    )
      .map((ts) => {
        const date = DateHelper.date(ts);

        if (weekNumber !== date.week()) {
          weekNumber = date.week();
          x += 1;
        }

        if (date.format("d") === "0" || date.format("d") === "6") {
          return null;
        }

        return {
          t: ts,
          x,
          y: date.format("d") - 1,
        };
      })
      .filter((n) => n !== null);
  },
});
const cal = new CalHeatmap();
cal.addTemplates(weekDaysTemplate);
cal.paint(
  {
    range: 17,
    date: {
      start: new Date("2006-01-01"),
      min: new Date("2006-01-01"),
      max: new Date("2022-12-31"),
      timezone: "utc",
    },

    data: {
      source: "DatesIncidents.csv",
      type: "csv",
      x: "OCCUR_DATE",
      y: "INCIDENT_KEY",
      groupY: "count",
    },

    domain: {
      gutter: 0,
      type: "year",
      label: {
        //rotate: "left",
        position: "left",
        textAlign: "middle",
        offset: {
          x: 0,
          y: 0,
        },
        width: 50,
        offset: { x: -10, y: 5 },
        label: { text: null },
        subLabel: {
          width: 30,
          textAlign: "start",
          text: () =>
            dayjs.weekdaysShort().map((d, i) => (i % 2 == 0 ? "" : d)),
        },
      },
    },
    /* 
    legend: {
      show: true,
      label: "Shootings",
      width: 150,
      marginLeft: 10,
      marginRight: 10,
      dynamicDimension: false,
    },
  */
    verticalOrientation: true,
    subDomain: {
      dynamicDimension: true,
      width: vw / 56, //20,
      height: vh / 119, //5,
      gutter: 0,
      type: "day",
    },
    scale: {
      color: {
        type: "linear",
        domain: [0, 20],
        scheme: "Blues",
      },
    },

    // itemSelector: "#ex-stock",
  },
  [
    [
      Tooltip,
      {
        text: function (date, value, dayjsDate) {
          if (value == 1) {
            return (
              (value
                ? d3.format(",")(value) + " shooting" + " reported"
                : "0 shootings reported") +
              " on " +
              dayjsDate.format("LL")
            );
          } else {
            return (
              (value
                ? d3.format(",")(value) + " shootings" + " reported"
                : "0 shootings reported") +
              " on " +
              dayjsDate.format("LL")
            );
          }
        },
      },
    ],
  ]
);

window.onresize = function () {
  vh = window.innerHeight;
  vw = window.innerWidth;
  cal.paint({
    subDomain: {
      //width: 40,
      //height: 5,
      width: vw / 56, //20,
      height: vh / 119, //5,
    },
  });
};

//END
//CALENDAR
//HEATMAP

//START
//LEAFLET
//MAP

const myMap = L.map("map", {
  //center: [40.662857, -73.969917],
  center: [40.7061, -73.9969],
  zoomSnap: 0.25,
  zoomDelta: 0.75,
  zoom: 10.75,
  minZoom: 10.5,
  scrollWheelZoom: false,
  touchZoomRotate: true,
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
        classSet = "";
        Mtrue = parseInt(feature.properties.Mtrue);
        Mfalse = parseInt(feature.properties.Mfalse);
        if (Math.max(Mtrue, Mfalse) < 4) {
          classSet = "blinking";

          if (feature.properties.locCountOrig == 1) {
            topSet = " onTop";
          }
        }

        //If the count of victims doesn't appear to be duplicated
        //OR even if it's duplicated, it would be considered mass after it's corrected

        //If the count of victims DOES appear to be duplicated
        //given the previous conditional, this also means they wouldn't be considered mass

        //return L.circleMarker(latlng, {
        return L.circle(latlng, {
          radius: 125,
          fillColor: "blue",
          color: "yellow",
          weight: 0.3,
          opacity: 1,
          fillOpacity: 0.75,
          // className: "blinking",
          className: classSet + topSet,
        });
      },

      onEachFeature: function (feature, Rmass) {
        let truecount;
        let time12;
        let timeAP;
        truecount = Math.max(Mtrue, Mfalse);

        time12 =
          1 +
          ((parseInt(feature.properties.OCCUR_TIME.slice(0, 2)) + 11) % 12) +
          ":" +
          String(parseInt(feature.properties.OCCUR_TIME.slice(-5))).padStart(
            2,
            "0"
          );

        if (parseInt(feature.properties.OCCUR_TIME.slice(0, -6)) > 12) {
          timeAP = " PM";
        } else {
          timeAP = " AM";
        }

        Rmass.bindPopup(
          "Date: " +
            feature.properties.OCCUR_DATE +
            "<br>" +
            "Time: " +
            time12 +
            timeAP +
            // ": " +
            // feature.properties.OCCUR_TIME.slice(0, -3) +
            "<br>" +
            "Data: " +
            (Mtrue + Mfalse) +
            " victims" +
            "<br>" +
            "Analysis: " +
            truecount +
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
    // L.markerClusterGroup.layerSupport().addTo(myMap).checkIn(Rmass);
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

/*
let tabplus = document.querySelector("#toggler");
tabplus.addEventListener("click", function () {
  if (MurderOnly) {
    alert("this is something");
  }
});
*/
MarkersFirstLoad();

//start disable scroll-by zooming
myMap.on("click", function () {
  if (myMap.scrollWheelZoom.enabled()) {
    myMap.scrollWheelZoom.disable();
  } else {
    myMap.scrollWheelZoom.enable();
  }
});
//end disable scroll-by zooming

//start relocate slider
let moveit = function () {
  sliderMove = document.querySelector(".slider.leaflet-control");
  sliderPut = document.getElementById("mapcontslider");
  console.log("sliderPut" + sliderPut);
  console.log("sliderMove" + sliderMove);
  console.log(sliderMove);
  sliderPut.prepend(sliderMove);
  //sliderPut.style.position = "top:-100px";
  observer.disconnect();
};

var target = document.getElementById("map");
console.log("it");
//config not here
let happened = 0;
var observer = new MutationObserver(function (mutations) {
  var existing = document.getElementById("slider-current");
  mutations.forEach(function (mutation) {
    if (happened == 1) {
      observer.disconnect();
    } else {
      if (existing) {
        happened = 1;
        console.log("it happened");
        console.log(mutation.type);
        console.log(happened);
        moveit();
      } else {
        console.log("nope");
      }
    }
  });
});

var config = {
  attributes: true,
  childList: true,
  subtree: true,
  characterData: true,
};

observer.observe(target, config);
//end relocate slider

//observer.disconnect();
//observer.observe(target, config);
//END
//LEAFLET
//MAP

//console.log(document.getElementById("mapcont"));

//START
//VIDEO
//RESIZE

var vid1 = document.getElementById("vid1");
vid1.onplay = function () {
  vid1.style.width = "55vw";
  vid1.style.zIndex = "2";
  vid2.style.zIndex = "1";
};
vid1.onpause = function () {
  vid1.style.width = "25vw";
  // vid1.style.position =
};

var vid2 = document.getElementById("vid2");
vid2.onplay = function () {
  vid2.style.width = "55vw";
  vid2.style.zIndex = "2";
  vid1.style.zIndex = "1";
};
vid2.onpause = function () {
  vid2.style.width = "25vw";

  // vid1.style.position =
};

//END
//VIDEO
//RESIZE
