//RESET PAGE TO TOP
history.scrollRestoration = "manual";

//WAIT FOR PAGE TO LOAD
const preloader = document.querySelector(".preloader");
const postload = document.querySelector(".postload");
const thebody = document.querySelector("body");
preloader.style.transform = "scale(1)";
const fadeOut = setInterval(() => {
  if (!preloader.style.opacity) {
    preloader.style.opacity = 1;
  }
  if (preloader.style.opacity > 0) {
    preloader.style.opacity -= 0.1;
    postload.style.display = "in";
  } else {
    clearInterval(fadeOut);
    preloader.remove();
    postload.style.opacity = 1;
    thebody.style.setProperty("overflow-y", "unset");
    postload.style.pointerEvents = "auto";
  }
}, 300);

window.addEventListener("load", () => fadeOut);

//CALENDAR HEATMAP
let vh = window.innerHeight;
let vw = window.innerWidth;

const weekDaysTemplate = (DateHelper) => ({
  name: "weekday",
  parent: "day",
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

    verticalOrientation: true,
    subDomain: {
      dynamicDimension: true,
      width: vw / 56,
      height: vh / 119,
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
      width: vw / 56,
      height: vh / 119,
    },
  });
};

//LEAFLET MAP
const myMap = L.map("map", {
  center: [40.7061, -73.9969],
  zoomSnap: 0.25,
  zoomDelta: 0.75,
  zoom: 10.75,
  minZoom: 10.5,
  scrollWheelZoom: false,
  touchZoomRotate: true,
});

let Rmass;
let controlLayers;

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

        return L.circle(latlng, {
          radius: 125,
          fillColor: "blue",
          color: "yellow",
          weight: 0.3,
          opacity: 1,
          fillOpacity: 0.75,
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

    sliderControl = L.control.sliderControl({
      position: "topleft",
      layer: Rmass,
      timeAttribute: "OCCUR_DATE",
      tracksLayer: false,
      showAllOnStart: true,
      range: true,
      rezoom: false,
    });

    myMap.addControl(sliderControl);
    sliderControl.startSlider();
  });
}

MarkersFirstLoad();

//DISABLE SCROLL-BY ZOOMING
myMap.on("click", function () {
  if (myMap.scrollWheelZoom.enabled()) {
    myMap.scrollWheelZoom.disable();
  } else {
    myMap.scrollWheelZoom.enable();
  }
});

//RELOCATE SLIDER
let moveit = function () {
  sliderMove = document.querySelector(".slider.leaflet-control");
  sliderPut = document.getElementById("mapcontslider");
  console.log("sliderPut" + sliderPut);
  console.log("sliderMove" + sliderMove);
  console.log(sliderMove);
  sliderPut.prepend(sliderMove);
  observer.disconnect();
};

var target = document.getElementById("map");
console.log("it");
let happened = 0;
var observer = new MutationObserver(function (mutations) {
  var existing = document.getElementById("slider-current");
  mutations.forEach(function (mutation) {
    if (happened == 1) {
      observer.disconnect();
    } else {
      if (existing) {
        console.log("it happened");
        console.log(mutation.type);
        console.log(happened);
        moveit();
        happened = 1;
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

//RESIZE VIDEOS
let baseZ = 1;
var dynVid = document.querySelectorAll(".dynVid");
dynVid.forEach((group) => {
  group.onplay = function () {
    baseZ++;
    group.style.width = "55vw";
    group.style.zIndex = baseZ;
  };

  group.onpause = function () {
    group.style.width = "25vw";
  };
});
