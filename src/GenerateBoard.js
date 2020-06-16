import {
    NO_RES_DEAD_SPACE,
    NO_RES_EMPTY, PLAYER_CODE_NAMES,
    PLAYER_KEANU,
    PLAYER_TRINITY,
    PLAYER_MORPHEUS,
    RES_GOLD,
    RES_OIL,
    RES_WHEAT
} from "./Constants.js";
import DefaultBalance from "./DefaultBalance.js";

/** @see https://stackoverflow.com/a/2117523/2750743 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const generateTileModifier = (balance) => {
    const weights = balance.MODIFIER_WEIGHTS;
    const sum = Object.values(weights).reduce((a,b) => a + b);
    const roll = Math.random();
    let rollThreshold = 0;
    for (const [mod, weight] of Object.entries(weights)) {
        rollThreshold += weight / sum;
        if (roll < rollThreshold) {
            return mod;
        }
    }
    // I guess it's possible to exit this loop due to
    // float division error if roll hits 0.99999999999999
    return NO_RES_EMPTY;
};

/** @return {BoardState} */
const GenerateBoard = ({
    totalRows = 16,
    balance = DefaultBalance(),
} = {}) => {
    const uuid = uuidv4();
    const playerToPosition = {
        // TODO: calc positions dynamically based on board size
        [PLAYER_KEANU]: {col: 9, row: 10},
        [PLAYER_TRINITY]: {col: 11, row: 10},
        [PLAYER_MORPHEUS]: {col: 11, row: 11},
    };
    const playerToBuffs = {};
    for (const codeName of PLAYER_CODE_NAMES) {
        playerToBuffs[codeName] = [];
    }
    const tiles = [];
    for (let row = 0; row < totalRows; ++row) {
        for (let col = 0; col < row * 2 + 1; ++col) {
            const stander = Object.keys(playerToPosition)
                .find(k => {
                    return playerToPosition[k].row === row
                        && playerToPosition[k].col === col;
                });
            let modifier, owner;
            if (stander) {
                modifier = NO_RES_EMPTY;
                owner = stander;
            } else {
                modifier = generateTileModifier(balance);
                owner = null;
            }
            tiles.push({row, col, modifier, owner});
        }
    }
    const totalCells = tiles.filter(t => t !== NO_RES_DEAD_SPACE).length;
    const totalTurns = Math.floor(totalCells / 3) - 1;
    return {
        uuid: uuid,
        totalRows: totalRows,
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