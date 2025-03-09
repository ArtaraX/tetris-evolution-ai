// Get the canvas and its drawing context from the HTML
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas')
const nextCtx = nextCanvas.getContext('2d')


// Game constants
const BLOCK_SIZE = 20; // Each block is 20x20 pixels
const BOARD_WIDTH = 10; // Board is 10 blocks wide
const BOARD_HEIGHT = 20; // Board is 20 blocks tall


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
let currentPiece = createTetromino() // The falling piece
let pieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0].length / 2); // Center horizontally
let pieceY = 0; // Start at the top
let lastTime = 0; // Track the last frame’s timestamp
const dropSpeed = 500; // Piece drops every 500ms (adjustable)
let dropCounter = 0; // Count time since last drop
let score = 0
let bestScore = 0
let nextPiece = createTetromino()

const SPEED_LEVELS = [0, 100, 400]
let speedIndex = 2 //starting at 500ms refresh rate
let currentSpeed = SPEED_LEVELS[speedIndex]

let bestPieceX = pieceX
let bestPieceY = pieceY
let bestPieceShape = currentPiece

const POPULATION_SIZE = 30; // Bigger for blank slate
const MUTATION_RATE = 0.1; // chance of mutation happening
const MUTATION_STRENGTH = 0.2; //how much the weights/genes can change

let population = [];
for (let i = 0; i < POPULATION_SIZE; i++) {
    population.push({
        weights: {
            lines: Math.random() * 2 - 1,
            height: Math.random() * 2 - 1,
            holes: Math.random() * 2 - 1,
            bumpiness: Math.random() * 2 - 1
        },
        fitness: 0,
        gamesPlayed: 0
    });
}

let currentPlayerIndex = 0;
let generation = 1;

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
    currentPiece = nextPiece
    pieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0].length / 2); // Center it
    pieceY = 0; // Start at top
    if (checkCollision(pieceX, pieceY, currentPiece)) { // If it can’t spawn
        population[currentPlayerIndex].fitness = score
        population[currentPlayerIndex].gamesPlayed++
        currentPlayerIndex++
        console.log(`Generation ${generation} Game ${currentPlayerIndex} Over with Score: ${score}`)
        if (score >= bestScore){
            bestScore = score
        }

        if (currentPlayerIndex >= POPULATION_SIZE){
            currentPlayerIndex = 0 //resetting index to stay in bounds
            evolvePopulation() // TODO
            generation++
            console.log(`Generation ${generation} started!`)
        }

        board = createBoard(BOARD_WIDTH, BOARD_HEIGHT); // Reset the board
        score = 0
        
    }
    nextPiece = createTetromino()
}

function evolvePopulation(){
    population.sort((a,b) => b.fitness - a.fitness) //descending order
    console.log(`Generation ${generation} Best Fitness: ${population[0].fitness}`);
    const eliteSize = POPULATION_SIZE * 0.2 // top 20% of the population are kept
    const newPopulation = population.slice(0, eliteSize)

    //filling the remaining empty population slots
    while (newPopulation.length < POPULATION_SIZE){
        const parent1 = selectParent()
        const parent2 = selectParent()

        const child = crossover(parent1, parent2)

        mutate(child) //i could implement the mutation into crossover and save an extra step

        newPopulation.push(child)
    }

    population = newPopulation.map(player => ({
        weights: { ...player.weights }, // Deep copy weights to avoid reference issues
        fitness: 0,                     // Reset fitness for the next generation
        gamesPlayed: 0                  // Reset games played counter
    }));

}

function selectParent() {
    // Tournament selection: pick best of 3 random AIs
    const tournamentSize = 3;
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
        const idx = Math.floor(Math.random() * population.length);
        tournament.push(population[idx]);
    }
    return tournament.sort((a, b) => b.fitness - a.fitness)[0];
}

function crossover(parent1, parent2) {
    // Blend parents’ weights with a small random tweak
    const tweak = 0.1;
    return {
        weights: {
            lines: (parent1.weights.lines + parent2.weights.lines) / 2 + (Math.random() - 0.5) * tweak,
            height: (parent1.weights.height + parent2.weights.height) / 2 + (Math.random() - 0.5) * tweak,
            holes: (parent1.weights.holes + parent2.weights.holes) / 2 + (Math.random() - 0.5) * tweak,
            bumpiness: (parent1.weights.bumpiness + parent2.weights.bumpiness) / 2 + (Math.random() - 0.5) * tweak
        },
        fitness: 0,
        gamesPlayed: 0
    };
}

function mutate(player) {
    // Randomly adjust weights with 10% chance each
    if (Math.random() < MUTATION_RATE) player.weights.lines += (Math.random() - 0.5) * MUTATION_STRENGTH;
    if (Math.random() < MUTATION_RATE) player.weights.height += (Math.random() - 0.5) * MUTATION_STRENGTH;
    if (Math.random() < MUTATION_RATE) player.weights.holes += (Math.random() - 0.5) * MUTATION_STRENGTH;
    if (Math.random() < MUTATION_RATE) player.weights.bumpiness += (Math.random() - 0.5) * MUTATION_STRENGTH;
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


function drawNextPiece(){
    // Clear the preview canvas
    nextCtx.fillStyle = '#214B81'; // Match background color
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Draw the next piece
    nextCtx.fillStyle = 'white'
    const offsetX = (nextCanvas.width - nextPiece[0].length * BLOCK_SIZE) / 2; // Center horizontally
    const offsetY = (nextCanvas.height - nextPiece.length * BLOCK_SIZE) / 2; // Center vertically
    
    for (let y = 0; y < nextPiece.length; y++) {
        for (let x = 0; x < nextPiece[y].length; x++) {
            if (nextPiece[y][x]) {
                nextCtx.fillRect(
                    offsetX + x * BLOCK_SIZE,
                    offsetY + y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        }
    }
}

function updateInfo() {
    const infoDiv = document.getElementById('infoDiv');
    const player = population[currentPlayerIndex];
    infoDiv.innerHTML = `
        BEST SCORE: ${bestScore} <br><br>
        ${POPULATION_SIZE - currentPlayerIndex} games until evolution <br><br>
        Current Generation: ${generation}<br><br>
        (Weights/Genes)<br>
        Lines: ${player.weights.lines.toFixed(2)}<br>
        Height: ${player.weights.height.toFixed(2)}<br>
        Holes: ${player.weights.holes.toFixed(2)}<br>
        Bump: ${player.weights.bumpiness.toFixed(2)}<br><br>
        Controls: <br>
        Press 's' to switch between speeds!

    `;
}

function evaluateBoard(linesCleared, aggregateHeight, holes, bumpiness, weights) {
    return (
        weights.lines * linesCleared +
        weights.height * aggregateHeight +
        weights.holes * holes +
        weights.bumpiness * bumpiness
    );
}

function findBestMove(weights) {
    let bestScore = -Infinity;
    let bestX = pieceX;
    let bestRot = 0;
    let bestY = pieceY
    const originalPiece = currentPiece.map(row => [...row]);
    
    for (let rot = 0; rot < 4; rot++) {
        let width = currentPiece[0].length;
        for (let x = 0; x <= BOARD_WIDTH - width; x++) {
            
            // this collisionCheck seems to have fixed the infinite loop bug;
            // my game got stuck with infinite piece resets but the score didnt increase
            // i suspect the ai calculated that the best move would be in a place that was already occupied 
            if (!checkCollision(x, pieceY, currentPiece)){
                let tempY = pieceY
                let tempBoard = board.map(row => [...row]);

                while (!checkCollision(x, tempY + 1, currentPiece)) {
                    tempY++;
                }
                for (let y = 0; y < currentPiece.length; y++) {
                    for (let px = 0; px < currentPiece[y].length; px++) {
                       
                        if (currentPiece[y][px]) {
                            tempBoard[tempY + y][x + px] = 1;
                        }
                    }
                }
                let linesCleared = 0;
                for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
                    let isFull = true;
                    for (let col = 0; col < BOARD_WIDTH; col++) {
                        if (tempBoard[y][col] === 0) {
                            isFull = false;
                            break;
                        }
                    }
                    if (isFull) {
                        tempBoard.splice(y, 1);
                        tempBoard.unshift(Array(BOARD_WIDTH).fill(0));
                        linesCleared++;
                        y++;
                    }
                }
                // Calculate metrics
                let heights = Array(BOARD_WIDTH).fill(0);
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    for (let row = 0; row < BOARD_HEIGHT; row++) {
                        if (tempBoard[row][col]) {
                            heights[col] = BOARD_HEIGHT - row;
                            break;
                        }
                    }
                }
                let aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
                let holes = 0;
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    let blockFound = false;
                    for (let row = 0; row < BOARD_HEIGHT; row++) {
                        if (tempBoard[row][col]) {
                            blockFound = true;
                        } else if (blockFound && tempBoard[row][col] === 0) {
                            holes++;
                        }
                    }
                }
                let bumpiness = 0;
                for (let col = 0; col < BOARD_WIDTH - 1; col++) {
                    bumpiness += Math.abs(heights[col] - heights[col + 1]);
                }
                let score = evaluateBoard(linesCleared, aggregateHeight, holes, bumpiness, weights);
                if (score > bestScore) {
                    bestScore = score;
                    bestX = x;
                    bestY = tempY //necessary to draw the best placement
                    bestRot = rot;
                }
            }
            }

        rotatePiece();
    }
    
    currentPiece = originalPiece;
    // Update globals after finding best move
    bestPieceX = bestX;
    bestPieceY = bestY;
    bestPieceShape = currentPiece.map(row => [...row]);
    for (let i = 0; i < bestRot; i++) {
        const rotated = [];
        for (let x = 0; x < bestPieceShape[0].length; x++) {
            const row = [];
            for (let y = bestPieceShape.length - 1; y >= 0; y--) {
                row.push(bestPieceShape[y][x]);
            }
            rotated.push(row);
        }
        bestPieceShape = rotated;
    }
    return { x: bestX, rotations: bestRot };
}


//PIECE MOVEMENTS
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
    switch (event.key.toLowerCase()) {
        case 'ArrowLeft': moveLeft(); break
        case 'ArrowRight': moveRight(); break
        case 'ArrowUp': rotatePiece(); break
        case 'ArrowDown': moveDown(); break
        case ' ': hardDrop(); break
        case 's':
            speedIndex = (speedIndex + 1) % SPEED_LEVELS.length
            currentSpeed = SPEED_LEVELS[speedIndex]
            console.log(currentSpeed)
            dropCounter = 0
    }
})


// MAIN GAME LOOP
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    dropCounter += delta;
    if (dropCounter >= currentSpeed) {
        const bestMove = findBestMove(population[currentPlayerIndex].weights);
        for (let i = 0; i < bestMove.rotations; i++) {
            rotatePiece();
        }
        pieceX = bestMove.x;
        hardDrop(); // changes the y coordinate as far down as possible to keep the piece from colliding
        mergePiece() // committing the piece to the board
        clearLines() // after committing to the board the board must be updated if lines are full
        resetPiece() // after merging a new piece needs to be generated
        dropCounter = 0;
    }
    
    render();
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

    // Draw best placement 
    ctx.fillStyle = '#ffffee';
    for (let y = 0; y < bestPieceShape.length; y++) {
        for (let x = 0; x < bestPieceShape[y].length; x++) {
            if (bestPieceShape[y][x]) {
                ctx.fillRect(
                    (bestPieceX + x) * BLOCK_SIZE,
                    (bestPieceY + y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        }
    }
    drawScore()
    drawNextPiece()
    updateInfo()
}



// Initial draw
render();

// Make the piece fall every 500ms
// setInterval(moveDown, 500);

// Start the game loop
requestAnimationFrame(gameLoop);