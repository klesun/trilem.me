import {NO_RES_DEAD_SPACE, NO_RES_EMPTY, RES_GOLD, RES_OIL, RES_WHEAT} from "./Constants.js";

const DefaultBalance = () => ({
    MODIFIER_WEIGHTS: {
        [RES_GOLD]: 2,
        [RES_OIL]: 6,
        [RES_WHEAT]: 18,
        [NO_RES_DEAD_SPACE]: 15,
        [NO_RES_EMPTY]: 100,
    },
    /** how much does one stack of improvements increase the yield of a resource */
    IMPROVEMENT_BONUS: 0.1,
    TURNS_SKIPPED_ON_STEP_NEUTRAL_EMPTY: 1,
    TURNS_SKIPPED_ON_STEP_NEUTRAL_RESOURCE: 1,
    // WALL > EMPTY/RESOURCE
    TURNS_SKIPPED_ON_STEP_OWN_WALL: 0,
    TURNS_SKIPPED_ON_STEP_OWN_EMPTY: 1,
    TURNS_SKIPPED_ON_STEP_OWN_RESOURCE: 1,
    // to make aggressive game more preferable than
    // peacefully capturing tiles in a corner
    TURNS_SKIPPED_ON_STEP_ENEMY_WALL: 4,
    TURNS_SKIPPED_ON_STEP_ENEMY_EMPTY: 0,
    TURNS_SKIPPED_ON_STEP_ENEMY_RESOURCE: 0,
});

export default DefaultBalance;
