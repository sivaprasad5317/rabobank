"use strict";
/* globals NuanMessaging, BootStrapC2C */

import { escapeHtml } from './html.js';


var config = {
  siteID: 10006508,
  tagServer: "ts-eu2.inq.com"
};
const sessionStorageName = "psRabobankNuanceData";

function log(txt) {console.log("script.js: " + txt);}

function getip(host) {
  let qs = {
    name: host,
    type: "a",
    do: 1
  };
  var url = new URL("https://dns.google.com/resolve");
  Object.keys(qs).forEach(key => url.searchParams.append(key, qs[key]));
  // url = "https://dns.google/resolve?name=example.com&type=a&do=1"
  return fetch(url, {
    mode: 'cors'
  })
  .then((response) => {return response.json();})
  .then((json) => {
      if(json.Answer) {
          let ipanswer;
          json.Answer.some(function(item, index, array) {
            if(item.type == 1) {
              ipanswer = item;
              return true;
            }
          });
          return ipanswer.data;
      } else {
          return "not found";
      }

  });
}


// on nuanceData change:
/* globals NuanMessaging */
function onNuanceDataChange (){
  if(NuanMessaging){
      NuanMessaging.SDKAPI.publishNewPageData({"nuanceData":window.nuanceData});
      NuanMessaging.SDKAPI.reInitChat();
      console.log("@@@ nuanceData set: " + JSON.stringify(window.nuanceData));
  }
}
// onNuanceDataChange();

export function setNuanceData(newNuanceData) {
  if(!newNuanceData.SOSMonitor) {
    try {
      newNuanceData.SOSMonitor = JSON.parse(newNuanceData.sosmonitor);
    } catch(e) {
      console.error(e);
    }
  }
  sosSetHotWords(newNuanceData.SOSMonitor);
  newNuanceData.sosmonitor = JSON.stringify(newNuanceData.SOSMonitor);

  let item = $('#nuanceData');
  item.val(JSON.stringify(newNuanceData,"",2));
  window.sessionStorage.setItem(sessionStorageName, JSON.stringify(newNuanceData));
  item.removeClass("inerror");
  window.nuanceData = newNuanceData;
  onNuanceDataChange();
}

function showSimulationPanel() {

  const sampleNunaceData_1 = {
    // "locale": "nl",
    "username": "test_username",
    "email": "test_email@test.com",
    "accountname": "test_domain\\test_accountname",
    // "sosmonitorurl": "http://sosmonitor.rabobank.nl:8080/rabo-sosplus-server/ictportaal/application",
    // "genesysSimulation": false,
    // "ResponseTraits": [
    //   {
    //     "Name": "COUNTRY",
    //     "Value": "AUSTRALIA"
    //   },
    //   {
    //     "Name": "",
    //     "Value": ""
    //   }
    // ],
    // "NinaRemoteWelcome": true,
    // "preprod": true,
    // "sos": "disabled",
    "sosmonitor": []
  };
  const sampleNuanceData = {
    "username": "test_username",
    "email": "test_email@test.com",
    "accountname": "test_domain\\test_accountname",
    // "ResponseTraits": [
    //   {
    //     "Name": "COUNTRY",
    //     "Value": "AUSTRALIA"
    //   },
    //   {
    //     "Name": "",
    //     "Value": ""
    //   }
    // ],
    "sosmonitor": [
      {
        "name": "2connect",
        "status": 2,
        "description": "<p>SOS status 2 wordt gesimuleerd voor 2connect</p>",
        "description_en": "<p>SOS status 2 is simulated for 2connect.</p>"
      }
      ,
      {
        "name": "Outlook",
        "status": 3,
        "description": "<p>SOS status 3 wordt gesimuleerd voor Outlook.</p>",
        "description_en": "<p>SOS status 3 is simulated for Outlook.</p>"
      },
      {
        "name": "SBF (Beheer Zekerheden)",
        "status": 4,
        "description": "<p>SOS status 3 wordt gesimuleerd voor SBF - alias test case hotwords should be: ['SBF', 'Beheer', 'Beheer Zekerheden', 'Zekherde'].</p>",
      },

      //,
      //{
      //  "name": "ACP (Advies Collectief Pensioen)",
      //  "status": 1,
      //  "appinfo": [
      //    {
      //      "description": "<p>SOS status 1 is simulated for ACP (Advies Collectief Pensioen).</p>"
      //    }
      //  ]
      //},
      //{
      //  "name": "General",
      //  "status": 4,
      //  "appinfo": [
      //    {
      //      "description": "<p>SOS status 4 is simulated for General.</p>"
      //    }
      //  ]
      //}      
    ],
    sid: "test-sid",
    kanaavailable: "true",
    istargeted: true,
    
    // Xsiteurl: "https://raboweb.sharepoint.com/sites/application-genesyscloud",
    // Xsiteid: "b2697f95-0cbb-4db0-a21f-ea480c4626dd",

    siteurl: "https://raboweb.sharepoint.com/sites/application-RaboShop",
    siteid: "d7ac19f6-dbbb-4bf8-8be6-387b58b0b631",
    
    simdate: "2018-06-19 13:00",
    //RBNumber: "RB390336"
  };

  if(typeof(sampleNuanceData.sosmonitor) == "object") {
    sampleNuanceData.sosmonitor = JSON.stringify(sampleNuanceData.sosmonitor);
  }
  // in case SOSMonitor was set already, it will not be overridden here:
  let resultingNuanceData = sampleNuanceData;
  window.nuanceData = Object.assign(resultingNuanceData, window.nuanceData);

  setNuanceData(window.nuanceData);

  // create panel
  //createPanel();
  //function createPanel() {
  //  let div=$("#SimulationPanel");
  //  if(!div.length) {
  //    log("SimulationPanel added");
  //    div = $('<div id="SimulationPanel"></div>');
  //    $("body").append(div);
  //  }
  //  div.html("<h3>nuanceData (NinaVars) simulation:</h3>");
  //  // div.append("<pre id='NuanceData' style='white-space: pre-wrap; font-size: smaller;'>" + "initializing..." + "</pre>");
  //  div.append("<pre id='NuanceData' style='white-space: pre-wrap; font-size: smaller;'>" + "initializing..." + "</pre>");
  //  
  //}

  // update Panel
  //updatePanel();
  //function updatePanel() {
  //  let nuanceData = JSON.parse(JSON.stringify(window.nuanceData));
  //  if(typeof(nuanceData.sosmonitor) == "string") {
  //    try{
  //      nuanceData.sosmonitor = JSON.parse(nuanceData.sosmonitor);
  //    } catch(e) {}
  //  }
  //  $("#NuanceData").html(escapeHtml(JSON.stringify(nuanceData, null, 2)));
  //}

  // poll nuanceData for changes and update textarea
  // pollNuanceDataStatus = {};
  //function pollNuanceData() {
  //  // nuanceData
  //  {
  //    let item = $('#nuanceData');
  //    let newval = JSON.stringify(nuanceData, 0, 2);
  //    let oldval = item.val();
  //    if(newval != oldval) {
  //      item.val(newval);
  //    }
  //  }
  //  setTimeout(pollNuanceData, 1000);
  //}
  //pollNuanceData();
  $('#nuanceData').change((event) => {
    console.log("nuanceData.onChange");
    let item = $('#nuanceData');
    let oldval = item.val();
    try {
      let nuanceData = JSON.parse(oldval);
      setNuanceData(nuanceData);
    } catch (e) {
      // ignore failures?
      // mark failing by red border item
      item.addClass("inerror");
    }
  });
}


async function init (me, _delay) {
  console.log("@@@ init");
  showSimulationPanel();

  var url_string = window.location.href;
  var url = new URL(url_string);
  var DC = url.searchParams.get("DC");
  var mix = url.searchParams.get("mix");
  var lang = url.searchParams.get("lang");
  window.nuanceData = window.nuanceData || {};
  if(lang) {
    window.nuanceData.pagelang = lang;
  } else if(mix) {
    window.nuanceData.pagelang = "nl";
  }
  setNuanceData(window.nuanceData);

  var inqSiteID = config.siteID;
  var name = "rabobank";
  var tagDomain, dc;
  if(DC == "PREPROD") {
    // PREPROD
    // tagDomain = "https://rabobank-preprod.inq.com";
    tagDomain = "https://rabobank-preprod.lle.digital.nuance.com";
    dc = "eu2-demo-001"; // to be tested!
  } else {
    // PROD
    tagDomain = "https://rabobank.inq.com";
    dc = "eu2";
  }
  try {
    await sosMonitorPromise;
  } catch(e) {
    console.error(e);
  }


  NuanMessaging.initializeMessagingSDK(dc, name, "" + inqSiteID, function () {
//    NuanMessaging.initializeMessagingSDK("eu2", "rabobank", "10006508", function () {
    console.log("@@@ initializeMessagingSDK CBfunction");
    NuanMessaging.getAndSetSDKConfig().siteID = inqSiteID;
    NuanMessaging.getAndSetSDKConfig().overrideTagDomain(tagDomain);

    var c2c = new BootStrapC2C({
      accessibilityMessages: {
        end: "End Chat",
        resume: "Resume Chat",
        start: "Start Chat"
      },
    });

    // TODO: minimize needs extra C2C to continue!

    NuanMessaging.getAndSetSDKConfig().enableC2CPluginForMinimizedState(c2c);	
    NuanMessaging.loadChatAssets(true);

    NuanMessaging.getAndSetSDKConfig().setPageData("nuanceData", window.nuanceData);
    console.log("@@@ nuanceData set: " + JSON.stringify(window.nuanceData));
    // no idea about this function "addCustomJavascript"
    // 
    // NuanMessaging.addCustomJavascript("startAnywhere365Chat",function(){
    //   window.top.postMessage("startAnywhere365Chat");
    // });

  });

  // var delay=_delay;

  // log("init - delay=" + delay);
  // if(!delay) {
  //   delay = 1000;
  // } else {
  //   delay = delay * 2;
  // }

  // if(!NuanMessaging) {
  //   // retry in delay ms
  //   log("NuanMessaging not yet defined");
  //   setTimeout(init, delay, delay);
  //   return;
  // }

  // movec to other file:
  // getSOSMonitor().then((SOSMonitor) => {
  //   nuanceData = nuanceData || {};
  //   nuanceData.SOSMonitor = SOSMonitor;
  //   log("SOSMonitor received:" + JSON.stringify(window.NinaVars.SOSMonitor));
  //   ... NuanMessaging.getAndSetSDKConfig().setPageData("nuanceData", window.NinaVars);
  // });
}


//$(window).load(init);
$(document).ready(init);

testStuff();
function testStuff() {

    // trying to call a function by javascript inside the LiveChat link (solution from Nina classic UI)
    // 
    // this function is NOT CALLABLE from out of the IFRame!
    // so it will be called by a message event handler
    window.Nina = window.Nina || {};
    window.Nina.startAnywhere365Chat=function(){alert("startAnywhere365Chat");};

    // logging messages from IFrame:
    function receiveMessage(event) {
        let subject = event?.data?.LC?.subject;
        if(subject && typeof(subject) == "string") {
            // in the IFrame call: top.postMessage({LC:{subject:'subjcet'}}, "*");
            window.Nina.startAnywhere365Chat(subject);
        }
    }
    window.addEventListener('message', receiveMessage, false);
    window.addEventListener('message', function(event){
      console.log("NINA: got message: " + JSON.stringify(event.data));
    }, false);
    window.addEventListener('message', function(e){
      if(typeof(e.data) == "string" && e.data.match(/^lightbox/)) {
        alert("lightbox: " + e.data.substring(9));
      }
    }, false);
    window.addEventListener('message', function(e){
      if(typeof(e.data) == "string" && e.data.match(/^lightbox/)) {
        let url=e.data.substring(9);
        $("#lightbox").html("<iframe src='"+url+"'></iframe>");
      }
    }, false);
    
    console.log("NINA: message event handler registered");
}

function testStuffDeactivated() {
    // catching clicks on something special:
    //
    // this is NOT catching click events from inside the IFrame!
    $("#nuanChatStage").click(function(event) {
        let target = $(event.target);
        //let parents .parents()
        if(target.parents().is("a#ninaLiveagent")) {
        // alert("livechat clicked!");
        // event.stopPropagation();
        // event.preventDefault();
            console.log("clicked LiveChat");
        } else {
            console.log("clicked other");
        }
    });
    
    // About closing Nina when unloading current page:
    // 
    // this did not work yet for me
    $(window).on("unload", function(event){
        console.log("XXX unload event handler");
        return confirm("confirm unloading");
    });
    
  
}

// 
function availabilityCheckInit() {
  console.log("availabilityCheckInit");
  const availabilityCheckAll = document.querySelectorAll(".availabilityCheck");
  console.log(availabilityCheckAll.length);
  availabilityCheckAll.forEach((element, key, parent) => {
      const tds = element.querySelectorAll("td");
      let buid = tds.item(2).textContent;
      let agid = tds.item(4).textContent;
      let tgElement = tds.item(5);
      console.log(buid, agid, tgElement);
      iFrameAvailabilityCheck(buid, agid, tgElement);

      element.addEventListener("click", async () => {
          // showAvailabilityCheck(buid, agid, tgElement);
      });
  }, {});
  console.log("availabilityCheckInit finished");
}


async function iFrameAvailabilityCheck(buid, agid, tgElement) {
  // https://ts-eu2.inq.com/tagserver/launch/agentsAvailable.json?_rand=p3uzq&siteID=10006716&businessUnitID=19001252&agentGroupID=10007030
  const url = getACURL(undefined, undefined, buid, agid);
  tgElement.innerHTML = "<iframe src=\"" + url + "\">";
}


// ============================================================
// general availabilityCheck TS functions for 
// ============================================================

function getACURL(ts, siteID, buid, agid) {
  ts = ts || config.tagServer;
  let urlString = "https://" + ts + "/tagserver/launch/agentsAvailable.json";
  let data = {
      "_rand": Math.random,
      "siteID": siteID || config.siteID,
      businessUnitID: buid,
      agentGroupID: agid
  };
  const url = getQURL(urlString, data);
  return url;
}

function getQURL(urlString, query) {
  const url = new URL(urlString);
  for (const key in query) {
      if (Object.hasOwnProperty.call(query, key)) {
          const value = query[key];
          url.searchParams.append(key, value);
      }
  }
  return url;
}

async function availabilityCheck(ts, siteID, buid, agid) {
  const url = getACURL(ts, siteID, buid, agid) ;
  //const response = await fetch(url, {method: "POST"});

  const response = await fetch(url, {
      // method: "POST", // *GET, POST, PUT, DELETE, etc.
      // mode: "no-cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      // credentials: "same-origin", // include, *same-origin, omit
      headers: {
        // "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      //referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      //body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  // console.log(response);
  const jsonData = await response.json();
  //const jsonData = JSON.parse(await response.text());
  // const jsonData = await response.text();
  
  // console.log(jsonData);
  return(jsonData);
}

function uuidv4() {
  /* jshint bitwise:false */
  if(crypto && typeof(crypto.getRandomValues) == "function") {
      // browser?
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
  } else if (crypto && typeof(crypto.randomBytes) == "function"){
      // node.js 12
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
      );
  } else {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
  }
  /* jshint bitwise:true */
}

availabilityCheckInit();
