
export const PLAYER_KEANU = 'KEANU';
export const PLAYER_TRINITY = 'TRINITY';
export const PLAYER_MORPHEUS = 'MORPHEUS';

export const RES_WHEAT = 'WHEAT';
export const RES_OIL = 'OIL';
export const RES_GOLD = 'GOLD';

export const NO_RES_EMPTY = 'EMPTY';
export const NO_RES_DEAD_SPACE = 'DEAD_SPACE';

export const MOD_WALL = 'WALL';

export const BUFF_SKIP_TURN = 'SKIP_TURN';

// ▼▲▼▲▼
//  ▼▲▼
//   ▼
export const BOARD_SHAPE_TRIANGLE = 'TRIANGLE';
//  ▼▲▼▲▼▲▼
//  ▲▼▲▼▲▼▲
//  ▼▲▼▲▼▲▼
export const BOARD_SHAPE_RECTANGLE = 'RECTANGLE';
//  ▲▼▲▼▲
// ▲▼▲▼▲▼▲
// ▼▲▼▲▼▲▼
//  ▼▲▼▲▼
export const BOARD_SHAPE_HEXAGON = 'HEXAGON';
export const BOARD_SHAPE_RANDOM = 'RANDOM';

export const PLAYER_PLACEMENT_CENTERED = 'CENTERED';
export const PLAYER_PLACEMENT_RANDOM = 'RANDOM';
export const PLAYER_PLACEMENT_WHICHEVER = 'WHICHEVER';

export const BOARD_SHAPES = [BOARD_SHAPE_TRIANGLE, BOARD_SHAPE_RECTANGLE, BOARD_SHAPE_HEXAGON];
export const RESOURCES = [RES_WHEAT, RES_OIL, RES_GOLD];
export const PLAYER_CODE_NAMES = [PLAYER_KEANU, PLAYER_TRINITY, PLAYER_MORPHEUS];

export const AI_SKIP_TURNS = 'SKIP_TURNS';
export const AI_PURE_RANDOM = 'PURE_RANDOM';
export const AI_LEAST_RECENT_TILES = 'LEAST_RECENT_TILES';
export const AI_RESOURCE_PATHFINDING = 'RESOURCE_PATHFINDING';

export const HTTP_PORT = 23183;

/* not putting it in DefaultBalance.js to avoid confusion of whether or not it is included in the TOTAL_ROWS */
export const TOTAL_ROWS_RANDOM_EXTRA_DEFAULT = 6;

export const generateSizeRandomExtra = (BOARD_SHAPE, TOTAL_ROWS_RANDOM_EXTRA) => {
    const evenOnly = BOARD_SHAPE === BOARD_SHAPE_HEXAGON;
    if (evenOnly) {
        return 2 * Math.floor((TOTAL_ROWS_RANDOM_EXTRA / 2) * Math.random());
    } else {
        return Math.floor(TOTAL_ROWS_RANDOM_EXTRA * Math.random());
    }
};