import {
    NO_RES_DEAD_SPACE,
    NO_RES_EMPTY, PLAYER_CODE_NAMES,
    PLAYER_KEANU,
    PLAYER_TRINITY,
    PLAYER_MORPHEUS, BOARD_SHAPES, BOARD_SHAPE_SQUARE, BOARD_SHAPE_TRIANGLE, BOARD_SHAPE_HEX,
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

const makeStartPositions = (totalRows, boardShape) => {
    return {
        [PLAYER_KEANU]: {col: 1, row: 0},
        [PLAYER_TRINITY]: {col: 0, row: 1},
        [PLAYER_MORPHEUS]: {col: 1, row: 1},
    };
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

const generateBoardShape = (totalRows, boardShape) => {
    const tiles = [];
    if (boardShape === BOARD_SHAPE_SQUARE) {
        for (let row = 0; row < totalRows; ++row) {
            for (let col = 0; col < totalRows * 2 - 1; ++col) {
                tiles.push({row, col});
            }
        }
    } else if (boardShape === BOARD_SHAPE_TRIANGLE) {
        // TODO: triangle instead of square
        for (let row = 0; row < totalRows; ++row) {
            for (let col = 0; col < totalRows * 2 - 1; ++col) {
                tiles.push({row, col});
            }
        }
    } else if (boardShape === BOARD_SHAPE_HEX) {
        // TODO: hex instead of square
        for (let row = 0; row < totalRows; ++row) {
            for (let col = 0; col < totalRows * 2 - 1; ++col) {
                tiles.push({row, col});
            }
        }
    } else {
        throw new Error('Unknown board shape type - ' + boardShape);
    }
    return tiles;
};

/** @return {BoardState} */
const GenerateBoard = (balance = DefaultBalance()) => {
    const uuid = uuidv4();
    const boardShape = BOARD_SHAPES[Math.floor(Math.random() * BOARD_SHAPES.length)];
    const playerToPosition = makeStartPositions(balance.TOTAL_ROWS, boardShape);
    const playerToBuffs = {};
    for (const codeName of PLAYER_CODE_NAMES) {
        playerToBuffs[codeName] = [];
    }
    const tiles = generateBoardShape(balance.TOTAL_ROWS, boardShape).map(({row, col}) => {
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
            const mods = generateTileModifiers(balance);
            modifiers.push(...mods);
            owner = null;
        }
        return {row, col, modifiers, owner, improvementsBuilt: 0};
    });
    const totalCells = tiles.filter(t => t !== NO_RES_DEAD_SPACE).length;
    const totalTurns = totalCells * 2 / 3;
    return {
        uuid: uuid,
        totalRows: balance.TOTAL_ROWS,
        totalTurns: totalTurns,

        turnsLeft: totalTurns,
        turnPlayersLeft: [...PLAYER_CODE_NAMES],
        playerToBuffs: playerToBuffs,
        playerToPosition: playerToPosition,
        tiles: tiles,

        balance: balance,
    };
};

export default GenerateBoard;
