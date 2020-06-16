
import GenerateBoard from "./src/GenerateBoard.js";
import TileMapDisplay from "./src/TileMapDisplay.js";
import {PLAYER_CODE_NAMES, RESOURCES} from "./src/Constants.js";
import GetTurnInput from "./src/client/GetTurnInput.js";
import Api from "./src/client/Api.js";
import FightSession from "./src/FightSession.js";
import Sound, {setSoundEnabled} from "./src/client/Sound.js";

const gui = {
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    gameRules: document.querySelector('.game-rules'),
};

const ONLY_HOT_SEAT = false;

const audios = [
    Sound('./assets/audio/tile_move.aac'),
    Sound('./assets/audio/tile_move2.aac'),
    Sound('./assets/audio/tile_move3.aac'),
];

const firstBloodAudio = Sound('./assets/audio/ALLYOURBASEAREBELONGTOUS.mp3');
firstBloodAudio.audio.volume = 0.1;

const api = Api();

/** @return {BoardState} */
const getBoardState = async () => {
    if (ONLY_HOT_SEAT) {
        return {...GenerateBoard(), hotSeat: true};
    } else {
        return fetch('./api/getBoardState')
            .then(rs => rs.status !== 200
                ? Promise.reject(rs.statusText)
                : rs.json())
            .then(config => ({...config, hotSeat: false}))
            .catch(exc => {
                alert('Failed to fetch data from server. Falling back to hot-seat board. ' + exc);
                return {...GenerateBoard(), hotSeat: true};
            });
    }
};

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
    }
    for (const row of Object.values(matrix)) {
        for (const tile of Object.values(row)) {
            const player = tile.svgEl.getAttribute('data-owner');
            const resource = tile.svgEl.getAttribute('data-resource');
            if (player && RESOURCES.includes(resource)) {
                playerToResourceToSum[player][resource] += 1;
            }
        }
    }
    return playerToResourceToSum;
};

const calcScore = (resourceToSum) => {
    let multiplication = 1;
    for (const resource of RESOURCES) {
        multiplication *= resourceToSum[resource];
    }
    return multiplication;
};

const drawTable = () => {
    const tableBody = gui.playerList;
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

let firstBloodSpilled = false;
let soundEnabled = true;

const initHideable = () => {
    const hideableEls = document.querySelectorAll('.hideable');
    hideableEls.forEach( el => {
        const dataHide = el.getAttribute('data-hide');
        const state = localStorage.getItem(dataHide);

        const title = el.querySelector('.hide-title');
        const show = document.createElement('div');
        const showText = document.createElement('span');

        const isRight = el.classList.contains('hide-right');

        let appended = false;

        if (state && state === "hide") {
            el.classList.add('hidden');
            show.style.display = 'flex';
            el.parentNode.insertBefore(show, el);
        }

        show.classList.add('show-hideable');
        showText.innerHTML = 'Show';

        show.appendChild(showText);
        show.classList.add(isRight ? 'show-right' : 'show-left');

        show.onclick = e => {
            show.style.display = 'none';
            el.classList.remove('hidden');
            localStorage.setItem(dataHide, 'show');
        };

        title.onclick = e => {
            if (!el.classList.contains('hidden')) {
                el.classList.add('hidden');

                if (!appended) {
                    show.style.display = 'none';
                    el.parentNode.insertBefore(show, el);
                }

                localStorage.setItem(dataHide, 'hide');

                setTimeout( () => {
                    show.style.display = 'flex';
                }, 200);
            }
        };
    } );
};

(async () => {
    const enabledSvg = document.getElementById('sound-svg-enabled');
    const disabledSvg = document.getElementById('sound-svg-disabled');

    enabledSvg.onclick = e => {
        enabledSvg.style.display = "none";
        disabledSvg.style.display = "block";
        setSoundEnabled(false);
    };

    disabledSvg.onclick = e => {
        disabledSvg.style.display = "none";
        enabledSvg.style.display = "block";
        setSoundEnabled(true);
    };

    initHideable();
    const table = drawTable();

    const main = async () => {
        let boardState = await getBoardState();

        [...gui.gameRules.querySelectorAll('[data-balance-value]')].forEach(holder => {
            holder.textContent = boardState.balance[holder.getAttribute('data-balance-value')];
        });

        const matrix = TileMapDisplay(boardState, gui.tileMapHolder);

        const getTile = ({col, row}) => {
            return (matrix[row] || {})[col] || null;
        };

        const makeTurn = async (codeName, newTile) => {
            /** @type {MakeTurnParams} */
            const params = {
                uuid: boardState.uuid,
                codeName: codeName,
                col: newTile.col,
                row: newTile.row,
            };
            if (!boardState.hotSeat) {
                return api.makeTurn(params);
            } else {
                return FightSession({boardState}).makeTurn(params);
            }
        };

        const skipTurn = async (codeName) => {
            const params = {
                uuid: boardState.uuid,
                codeName: codeName,
            };
            if (!boardState.hotSeat) {
                return api.skipTurn(params);
            } else {
                return FightSession({boardState}).skipTurn(params);
            }
        };

        let releaseInput = () => {};

        const processTurn = async (codeName) => {
            const audioIndex = Math.floor(Math.random() * 3);
            const svgEl = gui.tileMapHolder.querySelector(`[data-stander=${codeName}]`);
            const col = +svgEl.getAttribute('data-col');
            const row = +svgEl.getAttribute('data-row');

            // glow possible turns
            const possibleTurns = FightSession({boardState})
                .getPossibleTurns(codeName)
                .map(getTile);
            possibleTurns.forEach( (tile) => {
                tile.svgEl.setAttribute('data-possible-turn', codeName);
            } );
            while (true) {
                const input = GetTurnInput({col, row, possibleTurns});
                releaseInput = input.cancel;
                let newTile = null;
                try {
                    newTile = await input.whenTile;
                } catch (exc) {
                    // TODO: programmatic!
                    if (exc === 'OLOLO_CANCELLED_BY_GAME') {
                        break;
                    }
                }
                if (!newTile) {
                    try {
                        boardState = await skipTurn(codeName);
                        break;
                    } catch (exc) {
                        alert('Failed to skip this turn - ' + exc);
                        continue;
                    }
                }
                const lastOwner = newTile.svgEl.getAttribute('data-owner');
                try {
                    boardState = await makeTurn(codeName, newTile);
                } catch (exc) {
                    alert('Failed to make this turn - ' + exc);
                    continue;
                }
                if (lastOwner && lastOwner !== codeName && !firstBloodSpilled) {
                    firstBloodSpilled = true;
                    firstBloodAudio.play();
                }

                if (soundEnabled) {
                    const tileMoveSound = audios[audioIndex];
                    tileMoveSound.audio.currentTime = 0;
                    tileMoveSound.audio.volume = (audioIndex === 0 ? 1 : 0.75) * 0.05;
                    tileMoveSound.play();
                }

                break;
            }
            // remove possible turns from last player
            possibleTurns.forEach( (tile) => tile.svgEl.removeAttribute('data-possible-turn') );
        };

        const startGame = async () => {
            // TODO: websockets
            const intervalId = setInterval(async () => {
                boardState = await api.getBoardState({uuid: boardState.uuid});
                TileMapDisplay.updateTilesState(matrix, boardState);
                releaseInput();
            }, 1000);

            while (boardState.turnPlayersLeft.length > 0) {
                gui.turnsLeftHolder.textContent = boardState.turnsLeft;
                const codeName = boardState.turnPlayersLeft[0];
                TileMapDisplay.updateTilesState(matrix, boardState);
                const playerResources = collectPlayerResources(matrix);
                table.redraw(codeName, playerResources);

                await processTurn(codeName).catch(exc => {
                    alert('Unexpected failure while processing turn - ' + exc);
                    throw exc;
                });
            }

            const playerResources = collectPlayerResources(matrix);
            const bestScore = Object.values(playerResources)
                .map(calcScore).sort((a,b) => b - a)[0];
            const winners = PLAYER_CODE_NAMES.filter(p => calcScore(playerResources[p]) === bestScore);

            alert('The winner is ' + winners.join(' and '));
            clearInterval(intervalId);
        };

        await startGame();
    };

    return main();
})();