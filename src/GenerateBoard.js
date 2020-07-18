import {
    NO_RES_DEAD_SPACE,
    NO_RES_EMPTY, PLAYER_CODE_NAMES,
    PLAYER_KEANU,
    PLAYER_TRINITY,
    PLAYER_MORPHEUS, BOARD_SHAPES, BOARD_SHAPE_RECTANGLE, BOARD_SHAPE_TRIANGLE, BOARD_SHAPE_HEXAGON,
} from "./Constants.js";
import DefaultBalance from "./DefaultBalance.js";

/** @see https://stackoverflow.com/a/2117523/2750743 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const generateTileModifiers = (balance) => {
    const weights = balance.MODIFIER_WEIGHTS;
    const sum = Object.values(weights).reduce((a,b) => a + b);
    const roll = Math.random();
    let rollThreshold = 0;
    for (const [mod, weight] of Object.entries(weights)) {
        rollThreshold += weight / sum;
        if (roll < rollThreshold) {
            return mod === NO_RES_EMPTY ? [] : [mod];
        }
    }
    // I guess it's possible to exit this loop due to
    // float division error if roll hits 0.99999999999999
    return [];
};

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

const makeStartPositions = (totalRows, boardShape, shapeTiles) => {
    const tilesLeft = [...shapeTiles];
    // place randomly
    const playerToPosition = {};
    for (const codeName of PLAYER_CODE_NAMES) {
        const index = Math.floor(Math.random() * tilesLeft.length);
        playerToPosition[codeName] = tilesLeft[index];
        tilesLeft.splice(index, 1)
    }
    return playerToPosition;

    // TODO: new x/y format
    // if (totalRows % 3 === 1) {
    //     // ▼ ▼
    //     //  ▼
    //     const maxCols = totalRows * 2 - 2;
    //     const centerCol = maxCols / 3;
    //     const centerRow = maxCols / 3;
    //     return {
    //         [PLAYER_KEANU]: {col: centerCol - 1, row: centerRow},
    //         [PLAYER_TRINITY]: {col: centerCol + 1, row: centerRow},
    //         [PLAYER_MORPHEUS]: {col: centerCol + 1, row: centerRow + 1},
    //     };
    // } else if (totalRows % 3 === 2) {
    //     //  ▲
    //     // ▲ ▲
    //     const maxCols = totalRows * 2 - 1;
    //     const centerCol = maxCols / 3;
    //     const centerRow = maxCols / 3;
    //     return {
    //         [PLAYER_KEANU]: {col: centerCol - 1, row: centerRow - 1},
    //         [PLAYER_TRINITY]: {col: centerCol - 1, row: centerRow},
    //         [PLAYER_MORPHEUS]: {col: centerCol + 1, row: centerRow},
    //     };
    // } else {
    //     // ▲ ▲
    //     //  ▲
    //     const topLeftCol = totalRows * 2 / 3 - 1;
    //     const topLeftRow = totalRows * 2 / 3 - 1;
    //     return {
    //         [PLAYER_KEANU]: {col: topLeftCol - 1, row: topLeftRow},
    //         [PLAYER_TRINITY]: {col: topLeftCol + 1, row: topLeftRow},
    //         [PLAYER_MORPHEUS]: {col: topLeftCol + 1, row: topLeftRow + 1},
    //     };
    // }
};

/** @return {BoardState} */
const GenerateBoard = (balance = DefaultBalance()) => {
    const uuid = uuidv4();
    const totalRows = balance.TOTAL_ROWS;
    const shapeOptions = BOARD_SHAPES.filter(shape => {
        // hex board can only be build for even number of rows
        const skip = shape === BOARD_SHAPE_HEXAGON && totalRows % 2 !== 0;
        return !skip;
    });
    const boardShape = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
    const firstPointUp = boardShape === BOARD_SHAPE_HEXAGON && totalRows % 4 !== 0;
    const firstPointsDown = !firstPointUp;
    const boardShapeTiles = generateBoardShape({totalRows, boardShape});
    const playerToPosition = makeStartPositions(balance.TOTAL_ROWS, boardShape, boardShapeTiles);
    const playerToBuffs = {};
    for (const codeName of PLAYER_CODE_NAMES) {
        playerToBuffs[codeName] = [];
    }
    const tiles = boardShapeTiles.map(({row, col}) => {
        const stander = Object.keys(playerToPosition)
            .find(k => {
                return playerToPosition[k].row === row
                    && playerToPosition[k].col === col;
            });
        const modifiers = [];
        let owner;
        if (stander) {
            owner = stander;
        } else {
            // TODO: check that DEAD_SPACE does not completely cut
            //  some board part out (and cover with unit tests >:D)
            const mods = generateTileModifiers(balance);
            modifiers.push(...mods);
            owner = null;
        }
        return {row, col, modifiers, owner, improvementsBuilt: 0};
    });
    const totalCells = tiles.filter(t => t !== NO_RES_DEAD_SPACE).length;
    const totalTurns = Math.floor(totalCells * 2 / 3);
    return {
        uuid: uuid,
        totalRows: totalRows,
        totalTurns: totalTurns,

        turnsLeft: totalTurns,
        turnPlayersLeft: [...PLAYER_CODE_NAMES],
        playerToBuffs: playerToBuffs,
        playerToPosition: playerToPosition,
        tiles: tiles,
        firstPointsDown: firstPointsDown,

        balance: balance,
    };
};

export default GenerateBoard;
