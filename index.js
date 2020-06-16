
import GenerateBoard from "./src/GenerateBoard.js";
import TileMapDisplay from "./src/TileMapDisplay.js";
import GetTurnInput from "./src/client/GetTurnInput.js";
import Api from "./src/client/Api.js";
import FightSession from "./src/FightSession.js";
import Sound, {setSoundEnabled} from "./src/client/Sound.js";
import Hideable from "./src/client/Hideable.js";
import StatsTable from "./src/client/StatsTable.js";

const gui = {
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    gameRules: document.querySelector('.game-rules'),
};

const ONLY_HOT_SEAT = false;

let firstBloodSpilled = false;
let soundEnabled = true;

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
            const audioIndex = Math.floor(Math.random() * 3);

            while (true) {
                const input = GetTurnInput({
                    currentSvgEl: gui.tileMapHolder.querySelector(`[data-stander=${codeName}]`),
                    // TODO: server to handle non-standard balance!
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