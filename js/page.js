console.log("started");
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