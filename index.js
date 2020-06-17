
import TileMapDisplay from "./src/TileMapDisplay.js";
import GetTurnInput from "./src/client/GetTurnInput.js";
import Hideable from "./src/client/Hideable.js";
import StatsTable from "./src/client/StatsTable.js";
import SoundManager from "./src/client/SoundManager.js";
import FightSessionAdapter, {getBoardState} from "./src/client/FightSessionAdapter.js";

const gui = {
    mainGame: document.querySelector('.main-game'),
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    nickNameField: document.querySelector('input.nick-name-field'),
    gameRules: document.querySelector('.game-rules'),
    soundSwitches: {
        enabled: document.getElementById('sound-svg-enabled'),
        disabled: document.getElementById('sound-svg-disabled'),
    },
};

let firstBloodSpilled = false;

const getBoardTools = async () => {
    Hideable().init();

    const initialBoardState = await getBoardState();
    const fightSession = FightSessionAdapter(initialBoardState);

    [...gui.gameRules.querySelectorAll('[data-balance-value]')].forEach(holder => {
        holder.textContent = initialBoardState.balance[holder.getAttribute('data-balance-value')];
    });

    const matrix = TileMapDisplay(initialBoardState, gui.tileMapHolder);
    const statsTable = StatsTable(gui.playerList, matrix);

    const getTile = ({col, row}) => {
        return (matrix[row] || {})[col] || null;
    };

    const updateComponents = () => {
        TileMapDisplay.updateTilesState(fightSession.getState(), getTile);
        const currentTurnPlayer = fightSession.getState().turnPlayersLeft[0];
        statsTable.update(currentTurnPlayer, matrix);
    };

    return {fightSession, getTile, updateComponents, statsTable};
};

(async () => {
    const soundManager = SoundManager(gui.soundSwitches);
    const {fightSession, getTile, updateComponents, statsTable} = await getBoardTools();

    let releaseInput = () => {};

    const processTurn = async (codeName) => {

        while (true) {
            const input = GetTurnInput({
                currentSvgEl: gui.tileMapHolder.querySelector(`[data-stander=${codeName}]`),
                // TODO: better ask server to make sure we can handle non-standard balance
                possibleTurns: (await fightSession.getPossibleTurns(codeName)).map(getTile),
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
                    await fightSession.skipTurn(codeName);
                    break;
                } catch (exc) {
                    alert('Failed to skip this turn - ' + exc);
                    continue;
                }
            }
            const lastOwner = newTile.svgEl.getAttribute('data-owner');
            try {
                await fightSession.makeTurn(codeName, newTile);
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
            const updated = await fightSession.checkForUpdates();
            if (updated) {
                updateComponents();
            }
            releaseInput();
            releaseInput = () => {};
        }, 1000);

        while (fightSession.getState().turnPlayersLeft.length > 0) {
            gui.turnsLeftHolder.textContent = fightSession.getState().turnsLeft;
            updateComponents();

            const codeName = fightSession.getState().turnPlayersLeft[0];
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
})();