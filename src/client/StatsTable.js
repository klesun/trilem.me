import {
    PLAYER_CODE_NAMES,
    RES_GOLD,
    RES_OIL,
    RES_WHEAT,
    RESOURCES,
    NO_RES_EMPTY,
    BUFF_SKIP_TURN
} from "../Constants.js";
import {MOD_PREFIX} from "../TileMapDisplay.js";
import {Dom} from "./Dom.js";

const calcScore = (resourceToSum) => {
    // maybe should have it as a formula, like array of recursive operands, so that
    // it could be automatically generated for Game Rules block on any change...
    let multiplication = 1;
    for (const resource of RESOURCES) {
        multiplication *= resourceToSum[resource];
    }
    return multiplication + resourceToSum[NO_RES_EMPTY];
};

/**
 * @param {BoardState} boardState
 *
 * TODO: move to FightSession.js since this is pure game logic, not frontend stuff
 */
const collectPlayerResources = (boardState) => {
    const playerToResourceToSum = {};
    for (const codeName of PLAYER_CODE_NAMES) {
        // players start with 1, because otherwise they would need
        // to collect _each_ resource to at least _nominate_ for winning
        // and I like the idea of rare resource sources quantity being random
        playerToResourceToSum[codeName] = {};
        for (const resource of RESOURCES) {
            playerToResourceToSum[codeName][resource] = 1;
        }
        playerToResourceToSum[codeName][NO_RES_EMPTY] = 0;
    }
    for (const tile of boardState.tiles) {
        const player = tile.owner;
        const resources = tile.modifiers.filter(mod => RESOURCES.includes(mod));
        if (player) {
            for (const resource of resources) {
                playerToResourceToSum[player][resource] += 1;
                playerToResourceToSum[player][resource] += tile.improvementsBuilt * boardState.balance.IMPROVEMENT_BONUS;
            }
            if (resources.length === 0) {
                playerToResourceToSum[player][NO_RES_EMPTY] += 1;
            }
        }
    }
    return playerToResourceToSum;
};

/**
 * @param {Number} value
 * 3.666666666 -> 3.66
 * 4.0000 -> 4
 */
const formatDecimal = (value, places = 1) => {
    return value % 1 > 0.000001 ? value.toFixed(places) : value;
};

/** @param {BoardState} boardState */
const StatsTable = (tableBody, boardState) => {
    const update = (codeName, newBoardState) => {
        boardState = newBoardState;
        const playerResources = collectPlayerResources(boardState);
        const getScore = trOwner => calcScore(playerResources[trOwner]);
        const sortedPlayers = PLAYER_CODE_NAMES
            .sort((a, b) => getScore(b) - getScore(a));

        const rows = sortedPlayers.map(trOwner => {
            const resourceToSum = playerResources[trOwner];
            const readyIn = boardState.turnPlayersLeft.includes(trOwner) ? 0 :
                1 + boardState.playerToBuffs[trOwner]
                    .filter(b => b === BUFF_SKIP_TURN).length;
            return Dom('tr', {
                'data-owner': trOwner,
                class: trOwner === codeName ? 'turn-pending' : '',
            }, [
                Dom('td', {class: 'player-name-holder'}, trOwner),
                Dom('td', {class: 'decimal-holder ready-in-holder'}, readyIn),
                Dom('td', {class: 'decimal-holder', 'data-resource': RES_WHEAT}, formatDecimal(resourceToSum[RES_WHEAT])),
                Dom('td', {}, 'x'),
                Dom('td', {class: 'decimal-holder', 'data-resource': RES_OIL}, formatDecimal(resourceToSum[RES_OIL])),
                Dom('td', {}, 'x'),
                Dom('td', {class: 'decimal-holder', 'data-resource': RES_GOLD}, formatDecimal(resourceToSum[RES_GOLD])),
                Dom('td', {}, '+'),
                Dom('td', {class: 'decimal-holder', 'data-resource': NO_RES_EMPTY}, resourceToSum[NO_RES_EMPTY]),
                Dom('td', {}, '='),
                Dom('td', {class: 'decimal-holder score-holder'}, formatDecimal(calcScore(resourceToSum), 2)),
            ]);
        });

        tableBody.innerHTML = "";
        rows.forEach( row => tableBody.appendChild(row) );
    };

    const getWinners = () => {
        const playerResources = collectPlayerResources(boardState);
        const bestScore = Object.values(playerResources)
            .map(calcScore).sort((a,b) => b - a)[0];
        return PLAYER_CODE_NAMES.filter(p => {
            return calcScore(playerResources[p]) === bestScore;
        });
    };

    return {
        update: update,
        getWinners: getWinners,
    };
};

export default StatsTable;
