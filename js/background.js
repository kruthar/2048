// Display the page action icon if we are on the www.2048tile.co page
chrome.tabs.onUpdated.addListener(function(id, tab, changeinfo){
    if(changeinfo.url.indexOf("gabrielecirulli.github.io/2048/") >= 0 || changeinfo.url.indexOf("www.2048tile.co") >= 0){
        chrome.pageAction.show(id);
    }
});