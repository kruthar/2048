var port;

chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    port = chrome.tabs.connect(tabs[0].id, {name: "2048connection"});
    port.onMessage.addListener(function(message){
        console.log(message.message);
    });
    port.postMessage({action: "init_board"});
});

$(".button").click(function(){
    port.postMessage({action: "move", data: {direction: $(this).val()}});
});

$("#optimizebutton").click(function(){
    port.postMessage({action: "optimize"});
});

$("#playbutton").click(function(){
    chrome.storage.local.get("2048_play_status", function(storage){
        if(storage["2048_play_status"]){
            $("#playbutton").html("play");
            port.postMessage({action: "play", data: {play: false}});
        } else {
            $("#playbutton").html("pause");
            port.postMessage({action: "play", data: {play: true}});
        }
        chrome.storage.local.set({"2048_play_status": !storage["2048_play_status"]});
    });
});

$(document).ready(function(){
    chrome.storage.local.get("2048_play_status", function(storage){
        if(storage["2048_play_status"]){
            $("#playbutton").html("pause");
        }
    });
})