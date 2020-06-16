import {NO_RES_EMPTY, PLAYER_CODE_NAMES, RES_GOLD, RES_OIL, RES_WHEAT, RESOURCES} from "../Constants.js";

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

const collectPlayerResources = (matrix) => {
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
    for (const row of Object.values(matrix)) {
        for (const tile of Object.values(row)) {
            const player = tile.svgEl.getAttribute('data-owner');
            const resource = tile.svgEl.getAttribute('data-resource');
            if (player) {
                playerToResourceToSum[player][resource] += 1;
            }
        }
    }
    return playerToResourceToSum;
};

const StatsTable = (tableBody, matrix) => {
    const rows = [];

    for (let player of PLAYER_CODE_NAMES) {
        const cols = [];
        const row = document.createElement('tr');
        row.setAttribute('data-owner', player);
        row.classList.add('turn-pending');

        const nameCol = document.createElement('td');
        nameCol.classList.add('player-name-holder');
        nameCol.innerHTML = player;
        cols.push(nameCol);

        for (let res of USED_MODIFIERS) {
            const resCol = document.createElement('td');
            const actionCol = document.createElement('td');

            resCol.setAttribute('data-resource', res);
            resCol.innerHTML = "1";
            actionCol.innerHTML = {
                [RES_WHEAT]: 'x',
                [RES_OIL]: 'x',
                [RES_GOLD]: '+',
                [NO_RES_EMPTY]: '=',
            }[res];
            cols.push(resCol, actionCol);
        }

        const scoreCol = document.createElement('td');
        scoreCol.classList.add('score-holder');
        scoreCol.innerHTML = "1";
        cols.push(scoreCol);

        cols.forEach( col => row.appendChild(col) );
        rows.push(row);
    }

    const update = (codeName, newMatrix) => {
        matrix = newMatrix;
        const playerResources = collectPlayerResources(matrix);
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
        const playerResources = collectPlayerResources(matrix);
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