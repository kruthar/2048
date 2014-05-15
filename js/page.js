var port;

chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    port = chrome.tabs.connect(tabs[0].id, {name: "2048connection"});
    port.onMessage.addListener(function(message){
        switch(message.action){
            case "game_over":
                chrome.storage.local.set({"2048_play_status": false});
                $("#playbutton").html("play");
                $("#playbutton").prop('disabled', true);
                break;
            default:
                console.log("unknown action: " + message.action);
                break;
        }
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
        if(storage["2048_play_status"]) {
            $("#playbutton").html("play");
            chrome.storage.local.set({"2048_play_status": false});
            port.postMessage({action: "play", data: {play: false}});
        } else {
            $("#playbutton").html("pause");
            chrome.storage.local.set({"2048_play_status": true});
            port.postMessage({action: "play", data: {play: true}});
        }
    });
});

$("#resetbutton").click(function(){
    port.postMessage({action: "play", data: {play: false}});
    chrome.storage.local.set({"2048_play_status": false});
    $("#playbutton").html("play");
    port.postMessage({action: "reset"});
    $("#playbutton").prop('disabled', false);
});

$("#auto-link").click(function(){
    $("#auto-link").hide();
    $("#manual-link").show();
    $("#manual-content").hide();
    $("#auto-content").show();

});

$("#manual-link").click(function(){
    $("#manual-link").hide();
    $("#auto-link").show();
    $("#auto-content").hide();
    $("#manual-content").show();

});

$(document).ready(function(){
    chrome.storage.local.get(["2048_play_status", "2048_speed", "2048_maxEmptiesWeight", "2048_minCornerWeight", "2048_minMatchesWeight"], function(storage){
        var speed = 50;
        var empties = 50;
        var corners = 50;
        var matches = 50;

        if(storage["2048_play_status"]){
            $("#playbutton").html("pause");
        }
        if(storage["2048_speed"]){
            speed = storage["2048_speed"];
        }
        if(storage["2048_maxEmptiesWeight"]){
            empties = storage["2048_maxEmptiesWeight"];
        }
        if(storage["2048_minCornerWeight"]){
            corners = storage["2048_minCornerWeight"];
        }
        if(storage["2048_minMatchesWeight"]){
            matches = storage["2048_minMatchesWeight"];
        }

        $("#speed-slider").slider({
            min: 1,
            max: 100,
            value: speed,
            change: function(){
                var newspeed = $("#speed-slider").slider("value");
                port.postMessage({action: "update_speed", data: {speed: newspeed}});
                chrome.storage.local.set({"2048_speed": newspeed});
            }
        });
        $("#empties-slider").slider({
            min: 0,
            max: 100,
            value: empties,
            change: update_weights
        });
        $("#corners-slider").slider({
            min: 0,
            max: 100,
            value: corners,
            change: update_weights
        });
        $("#matches-slider").slider({
            min: 0,
            max: 100,
            value: matches,
            change: update_weights
        });
    });
});

function update_weights(){
    var newempties = $("#empties-slider").slider("value");
    var newcorners = $("#corners-slider").slider("value");
    var newmatches = $("#matches-slider").slider("value");
    chrome.storage.local.set({"2048_maxEmptiesWeight": newempties});
    chrome.storage.local.set({"2048_minCornerWeight": newcorners});
    chrome.storage.local.set({"2048_minMatchesWeight": newmatches});
    port.postMessage({action: "update_weights"});
}