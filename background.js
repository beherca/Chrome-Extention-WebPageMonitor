var timmer = null;
var currentTab = null;
var diffTarget = null;
// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
    // No tabs or host permissions needed!
    console.log('Turning ' + tab.url + ' red!');
    console.log('Turning id ' + tab.id );
    // chrome.tabs.executeScript({
    //   code: 'setInterval(function(){console.log("timmer")}, 2000);'
    // });
    //chrome.tabs.executeScript(null, {file: "content_script.js"});
  
    if(currentTab == null){
        currentTab = tab;
        time();
    }else{
        if(currentTab.id != tab.id){
            currentTab = tab;
            stop_refresh();
        }
        time();
    }
    
});

function time(){
    if(!timmer){
        playSound("startup");
        chrome.tabs.sendMessage(currentTab.id, {command: "init"}, function(response) {
            console.log(response.farewell);
        });
        start_refresh();
    }else{
        chrome.tabs.sendMessage(currentTab.id, {command: "destroy"}, function(response) {
            console.log(response.farewell);
        });
        stop_refresh();
    }
}

function reload(){
    console.log("timmer");
    if(currentTab){
        chrome.tabs.reload(currentTab.id, function(){
            diff();
            start_refresh();
        });
    }
}

function start_refresh(){
    timmer = setTimeout(reload, 5000);
}


function stop_refresh(){
    clearTimeout(timmer);
    timmer = null;
    alert('stopped');
}


var started = false;

function shouldPlay(id) {
  // Ignore all events until the startup sound has finished.
  if (id != "startup" && !started)
    return false;
  var val = localStorage.getItem(id);
  if (val && val != "enabled") {
    console.log(id + " disabled");
    return false;
  }
  return true;
}

function didPlay(id) {
  if (!localStorage.getItem(id))
    localStorage.setItem(id, "enabled");
}

function playSound(id, loop) {
  if (!shouldPlay(id))
    return;

  var sound = sounds[id];
  console.log("playsound: " + id);
  if (sound && sound.src) {
    if (!sound.paused) {
      if (sound.currentTime < 0.2) {
        console.log("ignoring fast replay: " + id + "/" + sound.currentTime);
        return;
      }
      sound.pause();
      sound.currentTime = 0;
    }
    if (loop)
      sound.loop = loop;

    // Sometimes, when playing multiple times, readyState is HAVE_METADATA.
    if (sound.readyState == 0) {  // HAVE_NOTHING
      console.log("bad ready state: " + sound.readyState);
    } else if (sound.error) {
      console.log("media error: " + sound.error);
    } else {
      didPlay(id);
      sound.play();
    }
  } else {
    console.log("bad playSound: " + id);
  }
}

function stopSound(id) {
  console.log("stopSound: " + id);
  var sound = sounds[id];
  if (sound && sound.src && !sound.paused) {
    sound.pause();
    sound.currentTime = 0;
  }
}

var base_url = "http://dl.google.com/dl/chrome/extensions/audio/";
var sounds = {};

function soundLoadError(audio, id) {
  console.log("failed to load sound: " + id + "-" + audio.src);
  audio.src = "";
  if (id == "startup")
    started = true;
}

function soundLoaded(audio, id) {
  console.log("loaded sound: " + id);
  sounds[id] = audio;
}

// Hack to keep a reference to the objects while we're waiting for them to load.
var notYetLoaded = {};

function loadSound(file, id) {
  if (!file.length) {
    console.log("no sound for " + id);
    return;
  }
  var audio = new Audio();
  audio.id = id;
  audio.onerror = function() { soundLoadError(audio, id); };
  audio.addEventListener("canplaythrough",
      function() { soundLoaded(audio, id); }, false);
  if (id == "startup") {
    audio.addEventListener("ended", function() { started = true; });
  }
  audio.src = base_url + file;
  audio.load();
  notYetLoaded[id] = audio;
}

loadSound('whoosh-19.mp3', 'startup');


function contentHandler(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    // if (request.greeting == "hello")
    //   sendResponse({farewell: "goodbye"});
    if(request.command === 'set'){
        console.info(JSON.parse(request.info));
        diffTarget = request.info;
    }
  }

chrome.runtime.onMessage.addListener(contentHandler);