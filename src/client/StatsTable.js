import {PLAYER_CODE_NAMES, RESOURCES} from "../Constants.js";

export const calcScore = (resourceToSum) => {
    let multiplication = 1;
    for (const resource of RESOURCES) {
        multiplication *= resourceToSum[resource];
    }
    return multiplication;
};

const StatsTable = (tableBody = null) => {
    if (!tableBody)
        return null;

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

        for (let res of RESOURCES) {
            const resCol = document.createElement('td');
            const actionCol = document.createElement('td');

            resCol.setAttribute('data-resource', res);
            resCol.innerHTML = "1";
            actionCol.innerHTML = res === RESOURCES[RESOURCES.length - 1] ? "=" : "x";
            cols.push(resCol, actionCol);
        }

        const scoreCol = document.createElement('td');
        scoreCol.classList.add('score-holder');
        scoreCol.innerHTML = "1";
        cols.push(scoreCol);

        cols.forEach( col => row.appendChild(col) );
        rows.push(row);
    }

    const _redraw = (codeName, playerResources) => {
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

    return {
        redraw: _redraw,
    };
};

export default StatsTable;