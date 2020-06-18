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

const USED_MODIFIERS = [...RESOURCES, NO_RES_EMPTY];

/** @param {BoardState} boardState */
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
            }
            if (resources.length === 0) {
                playerToResourceToSum[player][NO_RES_EMPTY] += 1;
            }
        }
    }
    return playerToResourceToSum;
};

/** @param {BoardState} boardState */
const StatsTable = (tableBody, boardState) => {
    const rows = [];

    for (let player of PLAYER_CODE_NAMES) {
        const cols = [];

        cols.push(Dom('td', {
            class: 'player-name-holder',
        }, player));

        cols.push(Dom('td', {
            class: 'ready-in-holder',
        }));

        for (let res of USED_MODIFIERS) {
            const followingOperator = {
                [RES_WHEAT]: 'x',
                [RES_OIL]: 'x',
                [RES_GOLD]: '+',
                [NO_RES_EMPTY]: '=',
            }[res];
            cols.push(Dom('td', {'data-resource': res}, '1'));
            cols.push(Dom('td', {}, followingOperator));
        }

        const scoreCol = document.createElement('td');
        scoreCol.classList.add('score-holder');
        scoreCol.innerHTML = "1";
        cols.push(scoreCol);

        rows.push(Dom('tr', {
            'data-owner': player,
        }, cols));
    }

    const update = (codeName, newBoardState) => {
        boardState = newBoardState;
        const playerResources = collectPlayerResources(boardState);
        for (const tr of rows) {
            const trOwner = tr.getAttribute('data-owner');
            const turnPending = trOwner === codeName;
            tr.classList.toggle('turn-pending', turnPending);
            const resourceToSum = playerResources[trOwner];
            const totalScore = calcScore(resourceToSum);
            for (const td of tr.querySelectorAll('[data-resource]')) {
                const resource = td.getAttribute('data-resource');
                td.textContent = resourceToSum[resource];
            }
            tr.querySelector('.ready-in-holder').textContent =
                boardState.playerToBuffs[trOwner]
                    .filter(b => b === BUFF_SKIP_TURN).length;
            tr.querySelector('.score-holder').textContent = totalScore.toString();
        }

        tableBody.innerHTML = "";
        rows
            .sort( (a, b) => {
                const getScore = el => +el.querySelector('.score-holder').textContent;
                return getScore(b) - getScore(a);
            } )
            .forEach( row => tableBody.appendChild(row) );
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