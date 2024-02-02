/***********************************\
*                                   *
*                                   *  
*    TENTS AND TREES puzzle game    *
*                                   *
*                                   *
\***********************************/


/***********************************\
*    Constants and triggering       *
\***********************************/


const gridSize = 7; // Change this to adjust the grid size

const rowTentCounts = new Array(gridSize).fill(0); // Array to store tent counts for each row
const colTentCounts = new Array(gridSize).fill(0); // Array to store tent counts for each column
const numberOfTrees = Math.floor(gridSize * gridSize * 0.3); // 30% of total cell number

let currentTentsCount = 0;

const initialGameBoard = generateGameBoard(gridSize); // Creates the initial/winning state of the game; Stores it in a nested Array
const currentGameBoard = JSON.parse(JSON.stringify(initialGameBoard)); // Creates a deep copy => not linked to original Array

resetTents(currentGameBoard);

document.addEventListener('DOMContentLoaded', () => {
    // Render the initial game board on the HTML page
    renderGameBoard(currentGameBoard, rowTentCounts, colTentCounts);
    handleGridClick();
});


/***********************************\
*           Main Methods           *
\***********************************/


// Function to generate a random game board with trees and their adjacent tent counts
function generateGameBoard(size) {

    // Initialize an empty grid
    const grid = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            row.push({ tree: false, tent: false });
        }
        grid.push(row);
    }

    // Place a trees randomly on the grid + a tent next to every tree

    let removedTrees = 0;

    let treesPlaced = 0;
    const takenPositions = new Set(); // Set to track taken positions (by trees and tents)

    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];


    outerLoop: while (treesPlaced < numberOfTrees) {

        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);

        const treePosition = `${row},${col}`;

        if (!takenPositions.has(treePosition)) {
            grid[row][col].tree = true;
            takenPositions.add(treePosition);
            treesPlaced++;
            //console.log('just placed a tree on ' + treePosition);

            // place a tent next to the tree
            let tentPlaced = false;

            const randomizedDirections = shuffle(directions);


            for (const [dx, dy] of randomizedDirections) {
                const newRow = row + dx;
                const newCol = col + dy;

                const tentPosition = `${newRow},${newCol}`;

                if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size &&
                    !grid[newRow][newCol].tree && !grid[newRow][newCol].tent &&
                    !hasAdjacentTent(grid, newRow, newCol, size)) {

                    grid[newRow][newCol].tent = true;
                    //console.log('just placed a tent on ' + tentPosition);

                    takenPositions.add(tentPosition);
                    tentPlaced = true;

                    // Update tent counts for the row and column
                    rowTentCounts[newRow]++;
                    colTentCounts[newCol]++;

                    continue outerLoop;
                }

            }
            // if didt find place for tent, remove the tree and try place it elsewhere

            if (!tentPlaced) {
                grid[row][col].tree = false;
                takenPositions.delete(treePosition);
                treesPlaced--;
                //console.log('just removed a tree on ' + treePosition);
                removedTrees++;
            }

        }

    }

    //console.log('Row Tent Counts:', rowTentCounts);
    //console.log('Column Tent Counts:', colTentCounts);
    return grid;
}

// Function used in transition between the initial ant the current boards removing the tents
function resetTents(board) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            board[i][j].tent = false;
        }
    }
}

// Function to draw the current game board
function renderGameBoard(gameBoard, rowTentCounts, colTentCounts) {
    $('#gameBoard').empty(); // Clear previous content
    //console.log(gameBoard);
    //console.log(rowTentCounts);
    //console.log(colTentCounts);

    const boardContainer = $('<div>').addClass('boardContainer');

    const colCountsContainer = $('<div>').addClass('colCounts');
    $.each(colTentCounts, function(index, count) {
        const colTentCountDiv = $('<div>').addClass('count colCount').text(count);
        colCountsContainer.append(colTentCountDiv);
    });
    boardContainer.append(colCountsContainer);

    $.each(gameBoard, function(row, rowData) {
        const rowElement = $('<div>').addClass('row');

        const rowTentCountDiv = $('<div>').addClass('count rowCount').text(rowTentCounts[row]);
        rowElement.append(rowTentCountDiv);

        $.each(rowData, function(col, cellData) {
            const cell = $('<div>').addClass('cell');

            if (cellData.tree) {
                cell.addClass('tree');
            } else if (cellData.tent) {
                cell.addClass('tent');
            }
            cell.data('cellData', cellData);

            rowElement.append(cell);
        });

        boardContainer.append(rowElement);
    });

    $('#gameBoard').append(boardContainer);
}

// Function to check if current board matches the winning solution
function checkWinningCondition() {

    /* 
     *  1. Check tent count = tree count
     *  2. Current row count & current col count == initial count values ?
     *  3. Has adjacent tree and doesn't have adjacent tent
     */

    if (currentTentsCount == numberOfTrees) {

        for (let i = 0; i < currentGameBoard.length; i++) { // Iterates trough every cell row by row
            let currRowTentsCount = 0;

            for (let j = 0; j < currentGameBoard[i].length; j++) {
                if (currentGameBoard[i][j].tent) {
                    currRowTentsCount++;
                }
            }
            if (currRowTentsCount !== rowTentCounts[i]) {
                return false;
            } // Cheks if row count is right
        }

        for (let i = 0; i < currentGameBoard.length; i++) { // Iterates trough every cell col by col
            let currColTentsCount = 0;

            for (let j = 0; j < currentGameBoard[i].length; j++) {
                if (currentGameBoard[j][i].tent) {
                    currColTentsCount++;
                }
            }
            if (currColTentsCount !== colTentCounts[i]) {
                return false;
            } // Cheks if col count is right
        }

        for (let i = 0; i < currentGameBoard.length; i++) { // Iterates trough every cell 
            let currRowTentsCount = 0;
            for (let j = 0; j < currentGameBoard[i].length; j++) {
                if (currentGameBoard[i][j].tent && (!hasAdjacentTree(currentGameBoard, i, j) || hasAdjacentTent(currentGameBoard, i, j))) {
                    return false;
                } 
            }

        }
        return true;
    }

    return false;
}

// Function to handle user clicks on the grid 
function handleGridClick() {
    $('#gameBoard').on('click', '.cell', function() {
        const cell = $(this);
        const cellData = cell.data('cellData');
        const row = cell.parent().index() - 1;
        const col = cell.index() - 1;

        if (!cellData.tree) {
            if (cellData.grass) {
                delete cellData.grass;
                cell.removeClass('grass').addClass('tent'); // Change to tent
                currentGameBoard[row][col].tent = true;
                currentTentsCount++;
                //console.log('Tent placed at:', row, col);
            } else if (cell.hasClass('tent')) {
                delete cellData.tent;
                cell.removeClass('tent'); // Change to blank
                currentGameBoard[row][col].tent = false;
                currentTentsCount--;
                //console.log('Cell reset at:', row, col);
            } else {
                cellData.grass = true;
                cell.addClass('grass'); // Change to grass
                //console.log('Grass placed at:', row, col);
            }

            if (checkWinningCondition()) { // Check for winning condition 
                applyRainbowAnimationToCells();
                console.log('Congratulations! You won!');
            }
        }
    });
}


/***********************************\
*        Secondary Methods         *
\***********************************/


// Function to shuffle an array randomly
function shuffle(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Function to check if there's a tent in adjacent cells
function hasAdjacentTent(grid, row, col) {
    const directions = [
        [-1, 0],
        [1, 0], // up, down
        [0, -1],
        [0, 1] // left, right
    ];

    for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (
            newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize &&
            grid[newRow][newCol].tent
        ) {
            //console.log("adj tent found for " + row, col);
            return true; // Adjacent tent found
        }
    }
    //console.log("no adj tent found for " + row, col);
    return false; // No adjacent tent found
}

// Function to check if there's a tree in adjacent cells
function hasAdjacentTree(grid, row, col) {

    const directions = [
        [-1, 0],
        [1, 0], // up, down
        [0, -1],
        [0, 1] // left, right
    ];

    for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (
            newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize &&
            grid[newRow][newCol].tree
        ) {
            //console.log("adj tree found for" + row, col);
            return true; // Adjacent tree found
        }
    }
    //console.log("no adj tree found for" + row, col);
    return false; // No adjacent tree found
}

// Function to call winning animation
function applyRainbowAnimationToCells() {

    /*/ First step is to "clear" the board from any svg background values => turn everything to grass
    $('.cell').each(function() {
        const cell = $(this);
        const cellData = cell.data('cellData');

        cell.removeClass('tent tree'); // Remove classes 'tent' and 'tree'
        cell.addClass('grass'); // Add class 'grass'
    });*/


    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        // Apply rainbow animation to each cell with a delay
        setTimeout(() => {
            cell.classList.add('rainbow-animation');
        }, index * 20); // Adjust the delay timing
    });
}

// Function called by the reset button
function resetGame() {
    window.location.reload();
}

// *NOT USING* Function to put grass on every blank cell in initial => Used in old checkWinningCondition function
function fillBlankCells(board) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (!board[i][j].tree && !board[i][j].tent) {
                board[i][j].grass = true;
            } else {
                board[i][j].grass = false;
            }
        }
    }
    return board;
}