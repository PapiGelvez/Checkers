const board = document.getElementById('board');

// No hay ficha: -1, negro: 0, blanco: 1
let positions = [
    [-1, 1, -1, 1, -1, 1, -1, 1],
    [1, -1, 1, -1, 1, -1, 1, -1],
    [-1, 1, -1, 1, -1, 1, -1, 1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [0, -1, 0, -1, 0, -1, 0, -1],
    [-1, 0, -1, 0, -1, 0, -1, 0],
    [0, -1, 0, -1, 0, -1, 0, -1]
];

let selectedPiece = null;

let currentTurn = 0;

let totalWhite = 12;
let totalBlack = 12;

let forcedPiece = null;

let possibleSquares = [];

let gameOver = false;

// Crear el tablero 8x8 y otorgar colores alternos
// i filas
for (let i = 0; i < 8; i++) {
    // j columnas
    for (let j = 0; j < 8; j++) {
        const square = document.createElement('div');
        square.classList.add('square');

        // c0f0 blanco, c1f0 negro, c2f0 blanco... Entonces, suma mod 2 == 1 -> brown, khaki otherwise
        ((i + j) % 2 === 1) ? square.classList.add('brown') : square.classList.add('khaki');
        
        square.setAttribute('square-row', i);
        square.setAttribute('square-column', j);

        // El listener referencia a la función clickSquare con los i,j que se guardaron durante la creación del tablero
        square.addEventListener('click', () => clickSquare(i, j));
        board.appendChild(square);

        // Agregar piezas
        // Si van piezas, crear div, guardar atributos de posicion, agregar Listener y asignar color dependiendo de la matriz
        if (positions[i][j] !== -1) {
            const piece = document.createElement('div');
            piece.classList.add('piece');
            piece.setAttribute('piece-row', i);
            piece.setAttribute('piece-column', j);
            piece.addEventListener('click', function(e) {
                e.stopPropagation();
                clickPiece(this);
            });
            square.appendChild(piece);
            
            if (positions[i][j] === 0) {
                piece.classList.add('black');
            } else if (positions[i][j] === 1) {
                piece.classList.add('white');
            }
        }
    }
}

// Seleccionar piezas y mover piezas
function clickPiece(piece) {
    if (gameOver) return;
    // Si hay una pieza obligada a mover, no permitir seleccionar otras
    if (forcedPiece && forcedPiece !== piece) {
        return;
    }
    // Si la pieza coincide con el turno actual, seleccionarla
    if (piece.classList.contains('black') && currentTurn === 0 || piece.classList.contains('white') && currentTurn === 1) {
    // Si ya hay una pieza seleccionada, deseleccionarla
        if (selectedPiece !== null) {
            selectedPiece.classList.remove('selected');
        }
        // Seleccionar la nueva pieza
        selectedPiece = piece;
        piece.classList.add('selected');
    }    
}

function clickSquare(clickedSquareRow, clickedSquareColumn) {
    if (gameOver) return;
    let square = document.querySelector(`[square-row="${clickedSquareRow}"][square-column="${clickedSquareColumn}"]`);

    // Si hay una pieza obligada a mover, solo pueden clickearse cuadrados dentro de possibleSquares
    // Si no hay pieza obligada a mover, siga con el código
    if (forcedPiece && !possibleSquares.some( s =>
        s.getAttribute('square-row') == clickedSquareRow && s.getAttribute('square-column') == clickedSquareColumn)) {
            return;
    }

    // Obtener posiciones antiguas (falta revisar si hay una pieza seleccionada)
    const selectedPieceRow = parseInt(selectedPiece.getAttribute('piece-row'));
    const selectedPieceColumn = parseInt(selectedPiece.getAttribute('piece-column'));

    let [isValidMove, justAte] = checkValidMove(clickedSquareRow, clickedSquareColumn, selectedPieceRow, selectedPieceColumn)

    // Mover una pieza si está seleccionada y cumple las condiciones
    if (selectedPiece !== null && isValidMove) {
        // Hacer que la pieza sea ahora hija del cuadrado seleccionado
        square.appendChild(selectedPiece);

        // Actualizar atributos de posición
        selectedPiece.setAttribute('piece-row', clickedSquareRow);
        selectedPiece.setAttribute('piece-column', clickedSquareColumn);
        
        // matriz[columnaNueva][filaNueva] = matriz[columnaVieja][filaVieja]
        positions[clickedSquareRow][clickedSquareColumn] = positions[selectedPieceRow][selectedPieceColumn]; // Actualizar nueva posición en matriz
        positions[selectedPieceRow][selectedPieceColumn] = -1; // La posición anterior queda vacía

        // Verificar si la pieza se convierte en reina
        if ((currentTurn === 0 && clickedSquareRow === 0 && !selectedPiece.classList.contains('queen')) || 
            (currentTurn === 1 && clickedSquareRow === 7 && !selectedPiece.classList.contains('queen'))) {
            
            selectedPiece.classList.add('queen');
            const crown = document.createElement('div');
            
            if (currentTurn === 0) {
                crown.classList.add('blackCrown');
            } else {
                crown.classList.add('whiteCrown');
            }

            selectedPiece.appendChild(crown);
        }

        // Si capturó, revisar 4 diagonales si es reina, 2 de lo contrario. Y ver si hay enemigo y espacio detrás
        // Si puede capturar, no deseleccionar
        if (justAte) {
            const canCaptureMore = hasMoreCaptures(selectedPiece);
            console.log("justAte?", justAte, "canCaptureMore?", canCaptureMore);
            if (canCaptureMore) {
                console.log("Queen can capture again");
                forcedPiece = selectedPiece;
                return; // Sin terminar el turno, permitir clickear otra casilla
            } else {
                console.log("No more captures, turn ends");
            }
        }
        forcedPiece = null;
        // Deseleccionar la pieza
        selectedPiece.classList.remove('selected');
        selectedPiece = null;
        possibleSquares = [];

        // Cambiar el turno
        currentTurn = (currentTurn === 0) ? 1 : 0;

        updateTurnIndicator();

        if (!playerHasMoves(currentTurn)) {
            gameOver = true;
            const turnIndicator = document.getElementById('turn');
            if (currentTurn === 0) {
                turnIndicator.textContent = "Red wins!!!";
                turnIndicator.style.color = 'rgb(249, 52, 49)';
            } else {
                turnIndicator.textContent = "Black wins!!!";
                turnIndicator.style.color = 'black';
            }
        }
    }   
}

// Moverse en diagonal 
function checkValidMove(clickedSquareRow, clickedSquareColumn, selectedPieceRow, selectedPieceColumn) {
    // Verificar que el movimiento sea diagonal
    const rowDiff = Math.abs(clickedSquareRow - selectedPieceRow);
    const colDiff = Math.abs(clickedSquareColumn - selectedPieceColumn);

    const isQueen = selectedPiece.classList.contains('queen');

    let isValid = false;

    // Si es reina, cualquier sentido es válido
    if (isQueen) {
        if (rowDiff === 1 && colDiff === 1) {
            if (positions[clickedSquareRow][clickedSquareColumn] === -1) {
                isValid = true;
                return [isValid, false];
            } else { // Si hay pieza propia o enemiga, no mover
                return [isValid, false];
            }
        } else if (rowDiff === 2 && colDiff === 2) {
            // Revisar si la reina puede comer, debe haber una pieza enemiga en la mitad y el cuadrado de destino debe estar vacío
            const middleRow = (clickedSquareRow + selectedPieceRow) / 2;
            const middleColumn = (clickedSquareColumn + selectedPieceColumn) / 2;

            // En la mitad no hay vacío, es de color contrario y el cuadrado de destino está vacío
            if (positions[middleRow][middleColumn] !== -1 && positions[middleRow][middleColumn] !== currentTurn && 
                positions[clickedSquareRow][clickedSquareColumn] === -1) {
                    eatPiece(middleRow, middleColumn);
                    isValid = true;
                    return [isValid, true];
            } else {
                return [isValid, false];
            }
        } else {
            return [isValid, false]; // La reina no puede ni comer ni moverse
        }
    } else { 
        // Si no es reina, verificar que el movimiento sea hacia adelante
        if (currentTurn === 0 && clickedSquareRow - selectedPieceRow === -1 && colDiff === 1) { // Negro hacia arriba (una col izq o der, delta row neg)
            if (positions[clickedSquareRow][clickedSquareColumn] === -1) {
                isValid = true;
                return [isValid, false];
            } else {
                return [isValid, false];
            }
        } else if (currentTurn === 1 && clickedSquareRow - selectedPieceRow === 1 && colDiff === 1) { // Blanco hacia abajo (una col izq o der, delta row pos)
            if (positions[clickedSquareRow][clickedSquareColumn] === -1) {
                isValid = true;
                return [isValid, false];
            } else {
                return [isValid, false];
            }
        } else if (currentTurn === 0 && clickedSquareRow - selectedPieceRow === -2 && colDiff === 2) { // Negro come
            const middleRow = (clickedSquareRow + selectedPieceRow) / 2;
            const middleColumn = (clickedSquareColumn + selectedPieceColumn) / 2;

            if (positions[middleRow][middleColumn] !== -1 && positions[middleRow][middleColumn] !== currentTurn && 
                positions[clickedSquareRow][clickedSquareColumn] === -1) {
                    eatPiece(middleRow, middleColumn);
                    isValid = true;
                    return [isValid, true];
            } else {
                return [isValid, false];
            }
        } else if (currentTurn === 1 && clickedSquareRow - selectedPieceRow === 2 && colDiff === 2) { // Blanco come
            const middleRow = (clickedSquareRow + selectedPieceRow) / 2;
            const middleColumn = (clickedSquareColumn + selectedPieceColumn) / 2;

            if (positions[middleRow][middleColumn] !== -1 && positions[middleRow][middleColumn] !== currentTurn && 
                positions[clickedSquareRow][clickedSquareColumn] === -1) {
                    eatPiece(middleRow, middleColumn);
                    isValid = true;
                    return [isValid, true];
            } else {
                return [isValid, false];
            }
        } else {
            return [isValid, false];
        }
    }
}

// Comer
function eatPiece(middleRow, middleColumn) {
    // Eliminar la pieza de la matriz
    positions[middleRow][middleColumn] = -1; 

    // Eliminar la pieza del DOM
    const middlePiece = document.querySelector(`[piece-row="${middleRow}"][piece-column="${middleColumn}"]`)

    if (middlePiece.classList.contains('black')) {
        totalBlack--;
        console.log(totalBlack);
    } else if (middlePiece.classList.contains('white')) {
        totalWhite--;
        console.log(totalWhite);
    }
    middlePiece.remove();
    
    if (totalBlack === 0) {
        const turnIndicator = document.getElementById('turn');
        turnIndicator.textContent = "Red wins!!!";
        turnIndicator.style.color = 'rgb(249, 52, 49)';
        gameOver = true;
    } else if (totalWhite === 0) {
        const turnIndicator = document.getElementById('turn');
        turnIndicator.textContent = "Black wins!!!";
        turnIndicator.style.color = 'black';
        gameOver = true;
    }
}

// Revisar si se puede comer otra vez: pieza enemiga y espacio vació detrás
function hasMoreCaptures(selectedPiece) {

    const clickedSquareRow = parseInt(selectedPiece.getAttribute('piece-row'));
    const clickedSquareColumn = parseInt(selectedPiece.getAttribute('piece-column'));

    // Reiniciar possibleSquares
    possibleSquares = [];

    diagonalRow1 = clickedSquareRow + 1; // Una fila abajo
    diagonalColumn1 = clickedSquareColumn + 1; // Una columna a la derecha

    diagonalRow2 = clickedSquareRow - 1; // Una fila arriba
    diagonalColumn2 = clickedSquareColumn - 1; // Una columna a la izquierda

    behindRow1 = clickedSquareRow + 2; // Dos filas abajo
    behindColumn1 = clickedSquareColumn + 2; // Dos columnas a la derecha
    
    behindRow2 = clickedSquareRow - 2; // Dos filas arriba
    behindColumn2 = clickedSquareColumn - 2; // Dos columnas a la derecha

    let canCapture = false;

    if (selectedPiece.classList.contains('queen')) {
        // +1+1, +1-1, -1+1, -1-1
        const diagonals = [
            [diagonalRow1, diagonalColumn1, behindRow1, behindColumn1],
            [diagonalRow1, diagonalColumn2, behindRow1, behindColumn2],
            [diagonalRow2, diagonalColumn1, behindRow2, behindColumn1],
            [diagonalRow2, diagonalColumn2, behindRow2, behindColumn2]
        ];

        for (const [enemyRow, enemyCol, emptyRow, emptyCol] of diagonals) {
            if (isInBounds(enemyRow, enemyCol) && isInBounds(emptyRow, emptyCol) && positions[enemyRow][enemyCol] !== -1 &&
                positions[enemyRow][enemyCol] !== currentTurn && positions[emptyRow][emptyCol] === -1) {
                    console.log("Checking queen capture from:", clickedSquareRow, clickedSquareColumn, "->", emptyRow, emptyCol);
                    console.log("Enemy at:", enemyRow, enemyCol, "equals in matrix:", positions[enemyRow][enemyCol], " . Empty at:", positions[emptyRow][emptyCol]);
                    forcedPiece = selectedPiece;
                    let possibleSquare = document.querySelector(`[square-row="${emptyRow}"][square-column="${emptyCol}"]`);
                    possibleSquares.push(possibleSquare);
                    canCapture = true;
                    console.log(positions);
            }
        } 
    } else if (currentTurn === 0) { // Si es negro, solo come hacia arriba si hay ficha blanca y un espacio después
        const diagonals = [
            [diagonalRow2, diagonalColumn1, behindRow2, behindColumn1],
            [diagonalRow2, diagonalColumn2, behindRow2, behindColumn2]
        ];

        for (const [enemyRow, enemyCol, emptyRow, emptyCol] of diagonals) {
            if (
                isInBounds(enemyRow, enemyCol) && isInBounds(emptyRow, emptyCol) &&
                positions[enemyRow][enemyCol] === 1 &&
                positions[emptyRow][emptyCol] === -1
            ) {
                forcedPiece = selectedPiece;
                let possibleSquare = document.querySelector(`[square-row="${emptyRow}"][square-column="${emptyCol}"]`);
                possibleSquares.push(possibleSquare);
                canCapture = true;
            }
        }
    } else if (currentTurn === 1) { // Si es blanca, solo come hacia abajo
        const diagonals = [
            [diagonalRow1, diagonalColumn1, behindRow1, behindColumn1],
            [diagonalRow1, diagonalColumn2, behindRow1, behindColumn2]
        ];

        for (const [enemyRow, enemyCol, emptyRow, emptyCol] of diagonals) {
            if (
                isInBounds(enemyRow, enemyCol) && isInBounds(emptyRow, emptyCol) &&
                positions[enemyRow][enemyCol] === 0 &&
                positions[emptyRow][emptyCol] === -1
            ) {
                forcedPiece = selectedPiece;
                let possibleSquare = document.querySelector(`[square-row="${emptyRow}"][square-column="${emptyCol}"]`);
                possibleSquares.push(possibleSquare);
                canCapture = true;
            }
        }
    }
    return canCapture;
}

function isInBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Mostrar el turno. Avisar cuando alguien gana
function updateTurnIndicator() {
    if (gameOver) return;
    const turnIndicator = document.getElementById('turn');
    if (currentTurn === 0) {
        turnIndicator.textContent = "Black's turn";
        turnIndicator.style.color = 'black';
    } else {
        turnIndicator.textContent = "Red's turn";
        turnIndicator.style.color = 'rgb(249, 52, 49)';
    }
}

function playerHasMoves(player) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (positions[row][col] === player) {
                const piece = document.querySelector(`[piece-row="${row}"][piece-column="${col}"]`);
                if (piece && canMove(piece)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Si puede comer o si puede moverse
function canMove(piece) {
    const row = parseInt(piece.getAttribute('piece-row'));
    const col = parseInt(piece.getAttribute('piece-column'));
    const isQueen = piece.classList.contains('queen');
    const directions = isQueen // 
        ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
        : currentTurn === 0 ? [[-1, 1], [-1, -1]]  // Si es turno de negras, posible dirección es hacia arriba (-1 row)
        : [[1, 1], [1, -1]]; //Si es de blancas/rojas, posible dirección es hacia abajo (-1 row)

    for (const [directionRow, directionColumn] of directions) {
        const r = row + directionRow;
        const c = col + directionColumn;
        if (isInBounds(r, c) && positions[r][c] === -1) return true; // Si puede moverse

        // Si puede comer
        const rr = row + 2 * directionRow;
        const cc = col + 2 * directionColumn;
        const enemyRow = row + directionRow;
        const enemyCol = col + directionColumn;
        if (
            isInBounds(rr, cc) &&
            positions[enemyRow][enemyCol] !== -1 &&
            positions[enemyRow][enemyCol] !== currentTurn &&
            positions[rr][cc] === -1
        ) return true;
    }
    return false;
}