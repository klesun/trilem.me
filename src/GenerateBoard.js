import {
    NO_RES_DEAD_SPACE,
    NO_RES_EMPTY,
    PLAYER_CODE_NAMES,
    PLAYER_KEANU,
    PLAYER_TRINITY,
    PLAYER_MORPHEUS,
    BOARD_SHAPES,
    BOARD_SHAPE_RECTANGLE,
    BOARD_SHAPE_TRIANGLE,
    BOARD_SHAPE_HEXAGON,
    BOARD_SHAPE_RANDOM,
    PLAYER_PLACEMENT_RANDOM, PLAYER_PLACEMENT_WHICHEVER, PLAYER_PLACEMENT_CENTERED,
} from "./Constants.js";
import DefaultBalance from "./DefaultBalance.js";
import {generateBoardShape, makeCenteredStartPositions} from "./common/BoardShapes.js";

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

const makeRandomStartPositions = (shapeTiles) => {
    const tilesLeft = [...shapeTiles];
    const positions = [];
    for (let i = 0; i < PLAYER_CODE_NAMES.length; ++i) {
        const index = Math.floor(Math.random() * tilesLeft.length);
        positions.push(tilesLeft[index]);
        tilesLeft.splice(index, 1);
    }
    return positions;
};

const makeStartPositions = ({totalRows, boardShape, shapeTiles, method}) => {
    if (method === PLAYER_PLACEMENT_WHICHEVER) {
        method = Math.random() < 0.25
            ? PLAYER_PLACEMENT_RANDOM
            : PLAYER_PLACEMENT_CENTERED;
    }
    const positions = {
        [PLAYER_PLACEMENT_RANDOM]: () => makeRandomStartPositions(shapeTiles),
        [PLAYER_PLACEMENT_CENTERED]: () => makeCenteredStartPositions({totalRows, boardShape}),
    }[method]();

    // probably should randomize positions among players at some point...
    const playerToPosition = {};
    for (let i = 0; i < positions.length; ++i) {
        const codeName = PLAYER_CODE_NAMES[i];
        playerToPosition[codeName] = positions[i];
    }
    return playerToPosition;
};

/**
 * TODO: this can be rewritten to typescript, client does not use it, and when he will, can do it with ts-browser
 *
 * @return {BoardState}
 */
const GenerateBoard = (balance = DefaultBalance()) => {
    if (balance.TOTAL_ROWS > 200) {
        throw new Error('Board Size may not exceed 200 (for now)');
    }
    const uuid = uuidv4();
    const totalRows = balance.TOTAL_ROWS;
    // putting hexagon twice to increase it chances to
    // compensate for it being possible only on even num of rows
    const shapeOptions = [...BOARD_SHAPES, BOARD_SHAPE_HEXAGON].filter(shape => {
        // hex board can only be build for even number of rows
        const skip = shape === BOARD_SHAPE_HEXAGON && totalRows % 2 !== 0;
        return !skip;
    });
    let boardShape = balance.BOARD_SHAPE;
    if (boardShape === BOARD_SHAPE_RANDOM) {
        boardShape = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
    } else if (!shapeOptions.includes(boardShape)) {
        throw new Error('Board shape ' + boardShape + ' not allowed with board size of ' + totalRows);
    }
    const firstPointUp = boardShape === BOARD_SHAPE_HEXAGON && totalRows % 4 !== 0;
    const firstPointsDown = !firstPointUp;
    const shapeTiles = generateBoardShape({totalRows, boardShape});
    const playerToPosition = makeStartPositions({
        totalRows, boardShape, shapeTiles,
        method: balance.PLAYER_PLACEMENT_METHOD,
    });
    const playerToBuffs = {};
    for (const codeName of PLAYER_CODE_NAMES) {
        playerToBuffs[codeName] = [];
    }
    const tiles = shapeTiles.map(({row, col}) => {
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
    }).filter(tile => !tile.modifiers.includes(NO_RES_DEAD_SPACE));
    const totalTurns = Math.floor(tiles.length * 2 / 3);
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
