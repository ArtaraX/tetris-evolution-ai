const canvas = document.getElementById('tetrisCanvas')

const ctx = canvas.getContext('2d')

const BLOCK_SIZE = 20
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

//creates a grid 20 rows with 10 columns
function createBoard(width, height) {
    return Array(height).fill().map(() => Array(width).fill(0))
}


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

function createTetromino() {
    const shapes = Object.keys(TETROMINOES)
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)]
    return TETROMINOES[randomShape]
}

//Game state variables
let board = createBoard(BOARD_WIDTH, BOARD_HEIGHT)
let currentPiece = createTetromino()

let pieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0] / 2)
let pieceY = 0 // vertical position of the piece; starts at the top 

//draw game on the canvas
function render(){
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let y=o; y < BOARD_HEIGHT; y++){
        for (let x = 0; x < BOARD_WIDTH; x++){
            if (board[x][y]){
                ctx.fillStyle = 'gray'

                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1) //-1 to make the blocks slightly smaller so we can see gaps
            }
        }
    }
}