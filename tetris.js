// Get the canvas and its drawing context from the HTML
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');


// Game constants
const BLOCK_SIZE = 20; // Each block is 20x20 pixels
const BOARD_WIDTH = 10; // Board is 10 blocks wide
const BOARD_HEIGHT = 20; // Board is 20 blocks tall

let lastTime = 0; // Track the last frame’s timestamp
const dropSpeed = 500; // Piece drops every 500ms (adjustable)
let dropCounter = 0; // Count time since last drop

let score = 0

// Function to create an empty board (2D array of zeros)
function createBoard(width, height) {
    return Array(height).fill().map(() => Array(width).fill(0));
}

// Define all tetromino shapes
const TETROMINOES = {
    I: [[1, 1, 1, 1]],         // Straight line
    O: [[1, 1], [1, 1]],       // Square
    T: [[0, 1, 0], [1, 1, 1]], // T-shape
    S: [[0, 1, 1], [1, 1, 0]], // S-shape
    Z: [[1, 1, 0], [0, 1, 1]], // Z-shape
    J: [[1, 0, 0], [1, 1, 1]], // J-shape
    L: [[0, 0, 1], [1, 1, 1]]  // L-shape
};

// Function to pick a random tetromino
function createTetromino() {
    const shapes = Object.keys(TETROMINOES); // Array of shape names
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)]; // Random index
    return TETROMINOES[randomShape]; // Return the shape’s 2D array
}

// Game state variables
let board = createBoard(BOARD_WIDTH, BOARD_HEIGHT); // The main board
let currentPiece = createTetromino(); // The falling piece
let pieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0].length / 2); // Center horizontally
let pieceY = 0; // Start at the top

// Check if a move would cause a collision
function checkCollision(x, y, piece) {
    for (let py = 0; py < piece.length; py++) { // Loop through piece rows
        for (let px = 0; px < piece[py].length; px++) { // Loop through piece columns
            if (piece[py][px]) { // If this is a block
                const boardX = x + px; // Piece’s x on the board
                const boardY = y + py; // Piece’s y on the board
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || // Out of bounds
                    (boardY >= 0 && board[boardY][boardX])) { // Hits a locked block
                    return true; // Collision detected
                }
            }
        }
    }
    return false; // No collision
}

// Move the piece down one block
function moveDown() {
    if (!checkCollision(pieceX, pieceY + 1, currentPiece)) { // Can it move down?
        pieceY++; // Move down
    } else { // If it can’t move down
        mergePiece() // Lock it into the board
        clearLines()
        resetPiece() // Spawn a new piece
    }
    render(); // Update the display
}

function hardDrop(){
    while (!checkCollision(pieceX, pieceY + 1, currentPiece)){
        pieceY++
    }
    // mergePiece()
    // clearLines()
    // resetPiece()
    // render()
}

// Lock the current piece into the board
function mergePiece() {
    for (let y = 0; y < currentPiece.length; y++) { // Loop through piece rows
        for (let x = 0; x < currentPiece[y].length; x++) { // Loop through piece columns
            if (currentPiece[y][x]) { // If this is a block
                board[pieceY + y][pieceX + x] = 1; // Mark it on the board
            }
        }
    }
}

// Spawn a new piece or reset the game
function resetPiece() {
    currentPiece = createTetromino(); // New random piece
    pieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0].length / 2); // Center it
    pieceY = 0; // Start at top
    if (checkCollision(pieceX, pieceY, currentPiece)) { // If it can’t spawn
        board = createBoard(BOARD_WIDTH, BOARD_HEIGHT); // Reset the board
        score = 0
        console.log("Game Over!");
    }
}

function clearLines(){
    let linesCleared = 0

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--){
        let isFull = true

        for (let x = 0; x < BOARD_WIDTH; x++){
            if (board[y][x] === 0){
                isFull = false
                break //breaking out of the inner loop and checking the next row 
            }
        }
        if (isFull){
            board.splice(y, 1) //remove row at index y; 
            board.unshift(Array(BOARD_WIDTH).fill(0))
            linesCleared++
            y++ //because all rows got shifted i need to jump one row down and perform the isFull? check
        }
    }

    // updating score according to standard tetris scoring system
    if (linesCleared > 0){
        switch (linesCleared){
            case 1: score += 40; break;
            case 2: score += 100; break;
            case 3: score += 300; break;
            case 4: score += 1200; break;
        }
    }
}

//drawing the score directly on the canvas
function drawScore() {
    ctx.fillStyle = 'black'; // Text color
    ctx.font = '16px Arial'; // Font size and style
    ctx.fillText(`Score: ${score}`, 10, 20); // Position at (10, 20)
}

function moveLeft(){
    if (!checkCollision(pieceX - 1, pieceY, currentPiece)){
        pieceX--
    }
}

function moveRight(){
    if (!checkCollision(pieceX + 1, pieceY, currentPiece)){
        pieceX++
    }
}

function rotatePiece(){
    const rotated = []
    for (let x = 0; x < currentPiece[0].length; x++){
        const row = []
        for (let y = currentPiece.length - 1; y >= 0; y--){
            row.push(currentPiece[y][x])
        }
        rotated.push(row)
    }
    if (!checkCollision(pieceX, pieceY, rotated)){
        currentPiece = rotated
    }
    render()
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
            moveLeft()
            break
        case 'ArrowRight':
            moveRight()
            break
        case 'ArrowUp':
            rotatePiece()
            break
        case 'ArrowDown':
            moveDown()
            break
        case ' ':
            hardDrop()
            break
    }
})


// Main game loop
function gameLoop(timestamp) {
    // If this is the first frame, set lastTime
    if (!lastTime) lastTime = timestamp;
    
    // Calculate time since last frame
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    
    // Add time to drop counter
    dropCounter += delta;
    
    // If enough time has passed, move the piece down
    if (dropCounter >= dropSpeed) {
        moveDown();
        dropCounter = 0; // Reset counter
    }
    
    // Redraw the screen every frame
    render();
    
    // Request the next frame
    requestAnimationFrame(gameLoop);
}


// Draw the board and piece on the canvas
function render() {
    ctx.fillStyle = '#214B81'; // Clear the canvas with
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Full canvas rectangle

    for (let y = 0; y < BOARD_HEIGHT; y++) { // Loop through board rows
        for (let x = 0; x < BOARD_WIDTH; x++) { // Loop through board columns
            if (board[y][x]) { // If this spot is occupied
                ctx.fillStyle = '#090909'; // Locked blocks are gray
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1); // Draw it
            }
        }
    }

    ctx.fillStyle = '#FFFFFF'; // Falling piece is white
    for (let y = 0; y < currentPiece.length; y++) { // Loop through piece rows
        for (let x = 0; x < currentPiece[y].length; x++) { // Loop through piece columns
            if (currentPiece[y][x]) { // If this is a block
                ctx.fillRect( // Draw it at its current position
                    (pieceX + x) * BLOCK_SIZE,
                    (pieceY + y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        }
    }
    drawScore()
}

// Initial draw
render();

// Make the piece fall every 500ms
// setInterval(moveDown, 500);

// Start the game loop
requestAnimationFrame(gameLoop);

