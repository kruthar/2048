#2048 Optimizer for Chrome

This Chrome Extension is forcasted to optimize play of the 2048 puzzle at http://gabrielecirulli.github.io/2048/
by looking at such metrics as number of empty cells remaining, proximity of large tiles to corners, proximity of
like tiles to each other, etc.

##HOW TO

To run this chrome extension you will of course need Chrome. Follow these steps:

1. Open a fresh tab in your Chrome browser and navigate to chrome://extensions.
2. Ensure the 'Developer Mode' checkbox is checked.
3. Click the button labeled 'Load unpacked extension...', select this path to this repo on your local machine.
4. In a second tab of your Chrome browser navigate to http://gabrielecirulli.github.io/2048/.
5. Click on the small puzzle piece icon at the far right of your URL box.

To edit the extension:

1. Make your code edits.
2. Open a fresh tab in your Chrome browser and navigate to chrome://extensions.
3. Under the 2048 Solver extension click the 'Reload' link.
4. If you already have a tab open to http://gabrielecirulli.github.io/2048/ then you will have to refresh that page and reopen the extension.

##Current State

*The extension currently allows you to manipulate the game through left, right, up and down buttons.
*There is an optimize button which will print out statistics on the next best move based on empty cells remaining, and proximity of large tiles to corners
*All relevant print outs can be seen in the console window of the 2048 tab.