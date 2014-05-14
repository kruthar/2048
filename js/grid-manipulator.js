var LEFT = 0;
var UP = 1;
var RIGHT = 2;
var DOWN = 3;

chrome.runtime.onConnect.addListener(function(port){
    if(port.name == "2048connection"){
        console.log("connected");
        port.onMessage.addListener(function(message){
            switch(message.action){
                case "init_board":
                    pretty_print(init_board());
                    break;
                case "move":
                    pretty_print(predict_move(parseInt(message.data.direction)));
                    move(parseInt(message.data.direction));
                    break;
                case "optimize":
                    get_best_move();
                    break;
                default:
                    console.log("unknown action: " + message.action);
                    break;
            }
        });
        init_script_div();
    }
});

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

function get_best_move(){
    var grids = [
        predict_move(LEFT),
        predict_move(UP),
        predict_move(RIGHT),
        predict_move(DOWN)
    ]

    // Find the move with the most empty cells after
    var maxEmpties = 0;
    var maxEmptiesDirection = 0;
    for(var i = 0; i < 4; i++){
        var empties = get_num_empty_cells(grids[i]);
        if(empties > maxEmpties){
            maxEmpties = empties;
            maxEmptiesDirection = i;
        }
    }
    console.log("optimized empties: " + maxEmptiesDirection + " with " + maxEmpties);

    // Find the move with the larger cells closer to a corner
    var corners = get_blank_board();
    for(var k = 0; k < 4; k++){
        for(var i = 0; i < 4; i++){
            for(var j = 0; j < 4; j++){
                //TODO: consider reducing the multiplier to the factor of 2,
                // or not? maybe large numbers need the large weight.
                corners[k][0] += (i + j) * grids[k][i][j];
                corners[k][1] += ((3 - i) + j) * grids[k][i][j];
                corners[k][2] += (i + (3 - j)) * grids[k][i][j];
                corners[k][3] += ((3 - i) + (3 - j)) * grids[k][i][j];
            }
        }
    }
    var minCorner = 100000;
    var minCornerDirection = 0;
    for(var i = 0; i < 4; i++){
        for(var j = 0; j < 4; j++){
            if(corners[i][j] < minCorner){
                minCorner = corners[i][j];
                minCornerDirection = i;
            }
        }
    }
    console.log("left: " + corners[0].join());
    console.log("up: " + corners[1].join());
    console.log("right: " + corners[2].join());
    console.log("down: " + corners[3].join());
    console.log("optimized corners: " + minCornerDirection + " with " + minCorner);
    return maxEmptiesDirection;
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
    return abs_grid(grid);
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

function init_board(){
    var tilePosRegex = /.*tile\-position\-(\d)\-(\d).*/;
    var tileValueRegex = /.*\stile\-(\d+)\s.*/;
    var grid = get_blank_board();
    $(".game-container .tile-container .tile").each(function(index){
        var pos = tilePosRegex.exec($(this).attr("class"));
        var val = tileValueRegex.exec($(this).attr("class"));
        if(grid[pos[1] - 1][pos[2] - 1] < val[1]){
            grid[pos[1] - 1][pos[2] - 1] = val[1];
        }
    });
    return grid;
}

function pretty_print(grid){
    for(var i = 0; i < 4; i++){
        console.log(grid[0][i] + " " + grid[1][i] + " " + grid[2][i] + " " + grid[3][i]);
    }
    console.log();
}

function get_blank_board(){
    return [[0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]];
}