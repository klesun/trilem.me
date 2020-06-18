import {NO_RES_DEAD_SPACE, NO_RES_EMPTY, RES_GOLD, RES_OIL, RES_WHEAT} from "./Constants.js";

const DefaultBalance = () => ({
    /** for simplicity, better to stick to numbers that give 100 in sum */
    MODIFIER_WEIGHTS: {
        [RES_GOLD]: 2,
        [RES_OIL]: 6,
        [RES_WHEAT]: 18,
        [NO_RES_DEAD_SPACE]: 9,
        [NO_RES_EMPTY]: 65,
    },
    TURNS_SKIPPED_ON_STEP_NEUTRAL_EMPTY: 1,
    TURNS_SKIPPED_ON_STEP_NEUTRAL_RESOURCE: 1,
    // WALL > EMPTY/RESOURCE
    TURNS_SKIPPED_ON_STEP_OWN_WALL: 0,
    TURNS_SKIPPED_ON_STEP_OWN_EMPTY: 1,
    TURNS_SKIPPED_ON_STEP_OWN_RESOURCE: 1,
    TURNS_SKIPPED_ON_STEP_ENEMY_WALL: 3,
    // to make aggressive game more preferable than
    // peacefully capturing tiles in a corner
    TURNS_SKIPPED_ON_STEP_ENEMY_EMPTY: 0,
    TURNS_SKIPPED_ON_STEP_ENEMY_RESOURCE: 0,
});

export default DefaultBalance;