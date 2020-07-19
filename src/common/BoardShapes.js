import {BOARD_SHAPE_HEXAGON, BOARD_SHAPE_RECTANGLE, BOARD_SHAPE_TRIANGLE} from "../Constants.js";


/** exported for tests */
export const generateBoardShape = ({totalRows, boardShape}) => {
    const tiles = [];
    if (boardShape === BOARD_SHAPE_RECTANGLE) {
        for (let row = 0; row < totalRows; ++row) {
            for (let col = 0; col < totalRows * 2 - 1; ++col) {
                tiles.push({row, col});
            }
        }
    } else if (boardShape === BOARD_SHAPE_TRIANGLE) {
        // at some point could randomly use flipped-vs-normal triangle...
        for (let row = 0; row < totalRows; ++row) {
            for (let col = row; col < totalRows * 2 - row - 1; ++col) {
                tiles.push({row, col});
            }
        }
    } else if (boardShape === BOARD_SHAPE_HEXAGON) {
        const half = totalRows / 2;
        for (let row = 0; row < totalRows; ++row) {
            const cutout = half > row ? half - row - 1 : row - half;
            for (let col = cutout; col < totalRows * 2 - cutout - 1; ++col) {
                tiles.push({row, col});
            }
        }
    } else {
        throw new Error('Unknown board shape type - ' + boardShape);
    }
    return tiles;
};

/** exported for tests */
export const makeCenteredStartPositions = ({totalRows, boardShape}) => {
    const totalCols = totalRows * 2 - 1;
    const centerCol = totalRows - 1;
    if (boardShape === BOARD_SHAPE_RECTANGLE) {
        if (totalRows % 2 === 0) {
            // one bottom center, two top on right and left
            const upperRow = totalRows / 2 - 1;
            const lowerRow = totalRows / 2;
            return [
                {col: centerCol - 1, row: upperRow},
                {col: centerCol + 1, row: upperRow},
                {col: centerCol, row: lowerRow},
            ];
        } else {
            // all in the middle row center
            const centerRow = (totalRows - 1) / 2;
            return [
                {col: centerCol - 1, row: centerRow},
                {col: centerCol, row: centerRow},
                {col: centerCol + 1, row: centerRow},
            ];
        }
    } else if (boardShape === BOARD_SHAPE_TRIANGLE) {
        if (totalRows % 3 === 1) {
            const centerRow = (totalRows - 1) / 3;
            //  ▲
            // ▲ ▲
            return [
                {col: centerCol, row: centerRow - 1},
                {col: centerCol - 1, row: centerRow},
                {col: centerCol + 1, row: centerRow},
            ];
        } else if (totalRows % 3 === 2) {
            const centerRow = (totalRows - 2) / 3;
            // ▼ ▼
            //  ▼
            return [
                {col: centerCol - 1, row: centerRow},
                {col: centerCol + 1, row: centerRow},
                {col: centerCol, row: centerRow + 1},
            ];
        } else {
            // ▲ ▲
            //  ▲
            //
            //  ▼
            // ▼ ▼
            const upperRow = totalRows / 3 - 1;
            const lowerRow = totalRows / 3;
            return [
                {col: centerCol, row: upperRow},
                {col: centerCol - 1, row: lowerRow},
                {col: centerCol + 1, row: lowerRow},
            ];
        }
    } else if (boardShape === BOARD_SHAPE_HEXAGON) {
        const upperRow = totalRows / 2 - 1;
        const lowerRow = totalRows / 2;
        return [
            {col: centerCol - 1, row: upperRow},
            {col: centerCol + 1, row: upperRow},
            {col: centerCol, row: lowerRow},
        ];
    } else {
        throw new Error('Unsupported board shape ' + boardShape + ' for centered players placement');
    }
};