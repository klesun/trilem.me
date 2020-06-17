
import GenerateBoard from "./src/GenerateBoard.js";
import TileMapDisplay from "./src/TileMapDisplay.js";
import GetTurnInput from "./src/client/GetTurnInput.js";
import Api from "./src/client/Api.js";
import FightSession from "./src/FightSession.js";
import Hideable from "./src/client/Hideable.js";
import StatsTable from "./src/client/StatsTable.js";
import SoundManager from "./src/client/SoundManager.js";

const gui = {
    mainGame: document.querySelector('.main-game'),
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    gameRules: document.querySelector('.game-rules'),
    soundSwitches: {
        enabled: document.getElementById('sound-svg-enabled'),
        disabled: document.getElementById('sound-svg-disabled'),
    },
};

const ONLY_HOT_SEAT = false;

let firstBloodSpilled = false;

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

(async () => {
    const soundManager = SoundManager(gui.soundSwitches);

    Hideable().init();

    const main = async () => {
        let boardState = await getBoardState();

        [...gui.gameRules.querySelectorAll('[data-balance-value]')].forEach(holder => {
            holder.textContent = boardState.balance[holder.getAttribute('data-balance-value')];
        });

        const matrix = TileMapDisplay(boardState, gui.tileMapHolder);
        const statsTable = StatsTable(gui.playerList, matrix);

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

            while (true) {
                const input = GetTurnInput({
                    currentSvgEl: gui.tileMapHolder.querySelector(`[data-stander=${codeName}]`),
                    // TODO: better ask server to handle non-standard balance!
                    possibleTurns: FightSession({boardState})
                        .getPossibleTurns(codeName)
                        .map(getTile),
                });
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
                    soundManager.playFirstBloodSound();
                }
                soundManager.playMoveSound();

                break;
            }
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
                statsTable.update(codeName, matrix);

                await processTurn(codeName).catch(exc => {
                    alert('Unexpected failure while processing turn - ' + exc);
                    throw exc;
                });
            }

            const winners = statsTable.getWinners();

            alert('The winner is ' + winners.join(' and '));
            clearInterval(intervalId);
        };

        await startGame();
    };

    return main();
})();