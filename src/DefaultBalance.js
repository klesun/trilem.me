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
    TURNS_SKIPPED_ON_CAPTURING_EMPTY: 2,
    TURNS_SKIPPED_ON_CAPTURING_RESOURCE: 0,
});

export default DefaultBalance;