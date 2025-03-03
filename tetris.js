// Get the canvas element from the HTML by its ID
const canvas = document.getElementById('tetrisCanvas');
// document is the whole webpage; getElementById finds the element with id="tetrisCanvas"
// const means this variable won’t be reassigned (it’s constant)

// Get the 2D drawing context from the canvas
const ctx = canvas.getContext('2d');
// ctx is like a toolbox for drawing shapes, colors, etc. on the canvas
// '2d' means we’re doing 2D graphics (not 3D)

// Define constants for the game (values that won’t change)
const BLOCK_SIZE = 20; // Each block in the game is 20 pixels by 20 pixels
const BOARD_WIDTH = 10; // The game board is 10 blocks wide
const BOARD_HEIGHT = 20; // The game board is 20 blocks tall
// These match the canvas size: 10 blocks * 20px = 200px wide, 20 blocks * 20px = 400px tall

// Function to create an empty game board as a 2D array
function createBoard(width, height) {
    // Array(height) creates an array with 'height' empty slots
    // .fill() fills it with undefined (we need something to map over)
    // .map(() => Array(width).fill(0)) turns each slot into an array of 'width' zeros
    return Array(height).fill().map(() => Array(width).fill(0));
    // Result: a height × width grid where every spot is 0 (empty)
}

// Define all Tetris shapes as 2D arrays (1 = block, 0 = empty)
const TETROMINOES = {
    I: [ // Straight line (4 blocks long)
        [1, 1, 1, 1]
    ],
    O: [ // Square (2x2)
        [1, 1],
        [1, 1]
    ],
    T: [ // T-shape
        [0, 1, 0], // Top row: empty, block, empty
        [1, 1, 1]  // Bottom row: all blocks
    ],
    S: [ // S-shape (zigzag)
        [0, 1, 1],
        [1, 1, 0]
    ],
    Z: [ // Z-shape (reverse zigzag)
        [1, 1, 0],
        [0, 1, 1]
    ],
    J: [ // J-shape (L flipped)
        [1, 0, 0],
        [1, 1, 1]
    ],
    L: [ // L-shape
        [0, 0, 1],
        [1, 1, 1]
    ]
};
// This is an object where each key (I, O, T, etc.) maps to an array of arrays

// Function to pick a random tetromino shape
function createTetromino() {
    const shapes = Object.keys(TETROMINOES); // Get array of shape names: ['I', 'O', 'T', ...]
    // Math.random() gives a number between 0 and 1
    // Multiply by shapes.length (7), then Math.floor rounds down to 0–6
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    return TETROMINOES[randomShape]; // Return the 2D array for that shape
}

// Game state variables (these will change as the game runs)
let board = createBoard(BOARD_WIDTH, BOARD_HEIGHT); // The main grid, starts empty
let currentPiece = createTetromino(); // The active falling piece (randomly chosen)
// pieceX is the horizontal position (in blocks, not pixels)
// Start in the middle: BOARD_WIDTH / 2, subtract half the piece’s width, round down
let pieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0].length / 2);
let pieceY = 0; // Vertical position (in blocks), starts at the top

// Function to draw the game on the canvas
function render() {
    // Clear the canvas by drawing a white rectangle over everything
    ctx.fillStyle = 'black'; // Set the fill color to white
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw rectangle from (0,0) to full size
    // canvas.width and canvas.height are 200 and 400 (from HTML)

    // Draw the board (any locked pieces)
    for (let y = 0; y < BOARD_HEIGHT; y++) { // Loop through each row
        for (let x = 0; x < BOARD_WIDTH; x++) { // Loop through each column
            if (board[y][x]) { // If this spot has a block (not 0)
                ctx.fillStyle = 'gray'; // Set color to gray for locked blocks
                // Draw a rectangle at (x, y) in block coordinates, scaled by BLOCK_SIZE
                // -1 makes blocks slightly smaller so we see gaps between them
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }

    // Draw the current falling piece
    ctx.fillStyle = 'white'; // Set color to blue for the active piece
    for (let y = 0; y < currentPiece.length; y++) { // Loop through piece rows
        for (let x = 0; x < currentPiece[y].length; x++) { // Loop through piece columns
            if (currentPiece[y][x]) { // If this spot in the piece is a block
                // Draw it at its current position (pieceX + x, pieceY + y), scaled to pixels
                ctx.fillRect(
                    (pieceX + x) * BLOCK_SIZE, // X position in pixels
                    (pieceY + y) * BLOCK_SIZE, // Y position in pixels
                    BLOCK_SIZE - 1,             // Width of block
                    BLOCK_SIZE - 1              // Height of block
                );
            }
        }
    }
}

// Call render to draw the initial state
render();