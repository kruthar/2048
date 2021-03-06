var LEFT = 0;
var UP = 1;
var RIGHT = 2;
var DOWN = 3;
var play_timeout = null;
var port;
var maxEmptiesWeight = 1;
var minCornerWeight = 1;
var minMatchesWeight = 1;
var maxMergesWeight= 1;
var speed = 50;

chrome.runtime.onConnect.addListener(function(p){
    if(p.name == "2048connection"){
        port = p;
        port.onMessage.addListener(function(message){
            switch(message.action){
                case "init_board":
                    pretty_print(init_board());
                    break;
                case "move":
                    pretty_print(predict_move(parseInt(message.data.direction)).grid);
                    move(parseInt(message.data.direction));
                    break;
                case "optimize":
                    move(get_best_move());
                    break;
                case "play":
                    console.log("play message");
                    if(message.data.play){
                        play();
                    } else {
                        clearTimeout(play_timeout);
                    }
                    break;
                case "update_weights":
                    get_weights();
                    break;
                case "update_speed":
                    speed = message.data.speed;
                    break;
                case "reset":
                    document.getElementsByClassName("restart-button")[0].click();
                    break;
                default:
                    console.log("unknown action: " + message.action);
                    break;
            }
        });
        init_script_div();
        check_game_over();
        //get_weights();
        get_speed();
    }
});

function get_speed(){
    chrome.storage.local.get("2048_speed", function(storage){
        speed = storage["2048_speed"];
    });
}

function get_weights(){
    chrome.storage.local.get(["2048_maxEmptiesWeight", "2048_minCornerWeight", "2048_minMatchesWeight"], function(storage){
        if(storage["2048_maxEmptiesWeight"]){
            maxEmptiesWeight = storage["2048_maxEmptiesWeight"];
        }
        if(storage["2048_minCornerWeight"]){
            minCornerWeight = storage["2048_minCornerWeight"];
        }
        if(storage["2048_minMatchesWeight"]){
            minMatchesWeight = storage["2048_minMatchesWeight"];
        }
    });
}

function check_game_over(){
    if (document.getElementsByClassName("game-message")[0].offsetParent !== null) {
        port.postMessage({action: "game_over"});
    }
}

function init_script_div(){
    var div = document.createElement('div');
    div.id = "2048-scripts";
    document.getElementsByTagName("body")[0].appendChild(div);
}

function execute_script(script){
    var div = document.createElement('script');
    div.textContent = script;
    document.getElementById("2048-scripts").appendChild(div);
}

function play(){
    var next_move = get_best_move();
    if(next_move > -1){
        console.log("play: " + next_move);
        move(next_move);
        play_timeout = setTimeout(function(){play();}, 100 + (speed * 30));
    } else {
        port.postMessage({action: "game_over"});
    }
}

function get_best_move(){
    var grids = [
        predict_move(LEFT),
        predict_move(UP),
        predict_move(RIGHT),
        predict_move(DOWN)
    ];
    var choices = [0, 0, 0, 0];

    console.log(grids);

    // Find the move with the most empty cells after
    var maxEmpties = -1;
    var maxEmptiesDirection = -1;
    var maxEmptiesAverage = 0;
    for(var i = 0; i < 4; i++){
        if(grids[i]){
            var empties = get_num_empty_cells(grids[i].grid);
            maxEmptiesAverage += empties;
            if(empties > maxEmpties){
                maxEmpties = empties;
                maxEmptiesDirection = i;
            }
        }
    }
    maxEmptiesAverage -= maxEmpties;
    maxEmptiesAverage /= 3;
    choices[maxEmptiesDirection]++;
    console.log("optimized empties: " + maxEmptiesDirection + " with " + maxEmpties);

    // Find the move with the larger cells closer to a corner
    var corners = get_blank_board();
    for(var k = 0; k < 4; k++){
        if(grids[k]){
            for(var i = 0; i < 4; i++){
                for(var j = 0; j < 4; j++){
                    //TODO: consider reducing the multiplier to the factor of 2,
                    // or not? maybe large numbers need the large weight.
                    corners[k][0] += (i + j) * grids[k].grid[i][j];
                    corners[k][1] += ((3 - i) + j) * grids[k].grid[i][j];
                    corners[k][2] += (i + (3 - j)) * grids[k].grid[i][j];
                    corners[k][3] += ((3 - i) + (3 - j)) * grids[k].grid[i][j];
                }
            }
        } else {
            corners[k] = null;
        }
    }

    var minCorner = 9007199254740992;
    var minCornerDirection = -1;
    var minCornerAverage = 0;
    for(var i = 0; i < 4; i++){
        if(corners[i]){
            for(var j = 0; j < 4; j++){
                minCornerAverage += corners[i][j];
                if(corners[i][j] < minCorner){
                    minCorner = corners[i][j];
                    minCornerDirection = i;
                }
            }
        }
    }
    minCornerAverage -= minCorner;
    minCornerAverage /= 3;
    choices[minCornerDirection]++;
    console.log("optimized corners: " + minCornerDirection + " with " + minCorner);

    // Find the move with the most cells next to matching cells
    var matches = [0, 0, 0, 0];
    for(var k = 0; k < 4; k++){
        if(grids[k]){
            for(var i = 0; i < 4; i++){
                for(var j = 0; j < 4; j++){
                    if(grids[k].grid[i][j] > 0){
                        if(i > 0 && grids[k].grid[i - 1][j] != 0){
                            matches[k] += Math.abs(grids[k].grid[i - 1][j] - grids[k].grid[i][j]);
                        }
                        if(i < 3 && grids[k].grid[i + 1][j] != 0){
                            matches[k] += Math.abs(grids[k].grid[i + 1][j] - grids[k].grid[i][j]);
                        }
                        if(j > 0 && grids[k].grid[i][j - 1] != 0){
                            matches[k] += Math.abs(grids[k].grid[i][j - 1] - grids[k].grid[i][j]);
                        }
                        if(j < 3 && grids[k].grid[i][j + 1] != 0){
                            matches[k] += Math.abs(grids[k].grid[i][j + 1] - grids[k].grid[i][j]);
                        }
                    }
                }
            }
        }
    }

    var minMatches = 9007199254740992;
    var minMatchesDirection = -1;
    var minMatchesAverage = 0;
    for(var i = 0; i < 4; i++){
        if(grids[i]){
            minMatchesAverage += matches[i];
            if(matches[i] < minMatches){
                minMatches = matches[i];
                minMatchesDirection = i;
            }
        }
    }
    minMatchesAverage -= minMatches;
    minMatchesAverage /= 3;
    choices[minMatchesDirection]++;
    console.log("optimized matches: " + minMatchesDirection + " with " + minMatches);

    var maxMerges = -1;
    var maxMergesDirection = -1;
    var maxMergesAverage = 0;
    for(var i = 0; i < 4; i++){
        if(grids[i]){
            maxMergesAverage += grids[i].merges;
            if(grids[i].merges > maxMerges){
                maxMerges = grids[i].merges;
                maxMergesDirection = i;
            }
        }
    }
    maxMergesAverage -= maxMerges;
    maxMergesAverage /= 3;
    choices[maxMergesDirection]++;
    console.log("optimized merges: " + maxMergesDirection + " with " + maxMerges);


    var score = [0, 0, 0, 0];
    var maxScore = -1;
    var maxScoreDirection = -1;
    score[maxEmptiesDirection] += (1 - (maxEmptiesAverage / maxEmpties)) * maxEmptiesWeight;
    score[minCornerDirection] += (1 - (minCorner / minCornerAverage)) * minCornerWeight;
    score[minMatchesDirection] += (1 - (minMatches / minMatchesAverage)) * minMatchesWeight;
    score[maxMergesDirection] += (1 - (maxMergesAverage / maxMerges)) * maxMergesWeight;

    for(var i = 0; i < 4; i++){
        if(grids[i] && score[i] > maxScore){
            maxScore = score[i];
            maxScoreDirection = i;
        }
    }

    var maxChoice = -1;
    var maxChoiceDirection = -1;
    for(var i = 0; i < 4; i++){
        if(choices[i] > maxChoice){
            maxChoiceDirection = i;
            maxChoice = choices[i];
        }
    }
    //return maxScoreDirection;
    return maxChoiceDirection;
    //return maxEmptiesDirection;
    //return minCornerDirection;
    //return minMatchesDirection;
    //return maxMergesDirection;
}

function get_num_empty_cells(grid){
    var count = 0;
    for(var i = 0; i < 4; i++){
        for(var j = 0; j < 4; j++){
            if(grid[i][j] == 0){
                count ++;
            }
        }
    }
    return count;
}

function predict_move(direction){
    var grid = init_board();
    var merges = 0;
    switch(direction){
        case LEFT:
            for(var i = 0; i < 4; i++){
                for(var j = 1; j < 4; j++){
                    var value = grid[j][i];
                    if(value > 0){
                        var index = j;
                        var swap = value;
                        for(var k = j - 1; k >= 0; k--){
                            if(grid[k][i] == 0){
                                index = k;
                            } else if(grid[k][i] == value){
                                merges += value;
                                index = k;
                                swap = value * -2;
                                break;
                            } else {
                                break;
                            }
                        }
                        grid[j][i] = 0;
                        grid[index][i] = swap;
                    }
                }
            }
            break;
        case RIGHT:
            for(var i = 0; i < 4; i++){
                for(var j = 2; j >= 0; j--){
                    var value = grid[j][i];
                    if(value > 0){
                        var index = j;
                        var swap = value;
                        for(var k = j + 1; k < 4; k++){
                            if(grid[k][i] == 0){
                                index = k;
                            } else if(grid[k][i] == value){
                                merges += value;
                                index = k;
                                swap = value * -2;
                                break;
                            } else {
                                break;
                            }
                        }
                        grid[j][i] = 0;
                        grid[index][i] = swap;
                    }
                }
            }
            break;
        case UP:
            for(var i = 0; i < 4; i++){
                for(var j = 1; j < 4; j++){
                    var value = grid[i][j];
                    if(value > 0){
                        var index = j;
                        var swap = value;
                        for(var k = j - 1; k >= 0; k--){
                            if(grid[i][k] == 0){
                                index = k;
                            } else if(grid[i][k] == value){
                                merges += value;
                                index = k;
                                swap = value * -2;
                                break;
                            } else {
                                break;
                            }
                        }
                        grid[i][j] = 0;
                        grid[i][index] = swap;
                    }
                }
            }
            break;
        case DOWN:
            for(var i = 0; i < 4; i++){
                for(var j = 2; j >= 0; j--){
                    var value = grid[i][j];
                    if(value > 0){
                        var index = j;
                        var swap = value;
                        for(var k = j + 1; k < 4; k++){
                            if(grid[i][k] == 0){
                                index = k;
                            } else if(grid[i][k] == value){
                                merges += value;
                                index = k;
                                swap = value * -2;
                                break;
                            } else {
                                break;
                            }
                        }
                        grid[i][j] = 0;
                        grid[i][index] = swap;
                    }
                }
            }
            break;
        default:
            console.log("unknown direction to predict: " + direction);
            break;
    }

    if(boards_equal(abs_grid(grid), init_board())){
        return null;
    }
    return {grid: abs_grid(grid), merges: merges};
}

function abs_grid(grid){
    for(var i = 0; i < 4; i++){
        for(var j = 0; j < 4; j++){
            grid[i][j] = Math.abs(grid[i][j]);
        }
    }
    return grid;
}

function move(direction){
    var script = "var keyEvent = document.createEvent('Events');";
    script += "var keyCode = " + (direction + 37) + ";";
    script += "keyEvent.initEvent('keydown', true, true);";
    script += "keyEvent.keyCode = keyCode;";
    script += "keyEvent.which = keyCode;";
    script += "document.body.dispatchEvent(keyEvent);";
    execute_script(script);
}

function boards_equal(grid, board){
    var equal = true;
    for(var i = 0; i < 4; i++){
        for(var j = 0; j < 4; j++){
            if(grid[i][j] != board[i][j]){
                equal = false;
                break;
            }
        }
        if(!equal){
            break;
        }
    }
    return equal;
}

function init_board(){
    var tilePosRegex = /.*tile\-position\-(\d)\-(\d).*/;
    var tileValueRegex = /.*\stile\-(\d+)\s.*/;
    var grid = get_blank_board();
    $(".game-container .tile-container .tile").each(function(index){
        var pos = tilePosRegex.exec($(this).attr("class"));
        var val = tileValueRegex.exec($(this).attr("class"));
        if(grid[pos[1] - 1][pos[2] - 1] < parseInt(val[1])){
            grid[pos[1] - 1][pos[2] - 1] = parseInt(val[1]);
        }
    });
    return grid;
}

function pretty_print(grid){
    if(grid){
        for(var i = 0; i < 4; i++){
            console.log(grid[0][i] + " " + grid[1][i] + " " + grid[2][i] + " " + grid[3][i]);
        }
    }else {
        console.log("non-move");
    }
}

function get_blank_board(){
    return [[0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]];
}