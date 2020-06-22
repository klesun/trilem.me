
import TileMapDisplay from "./src/TileMapDisplay.js";
import GetTurnInput from "./src/client/GetTurnInput.js";
import Hideable from "./src/client/Hideable.js";
import StatsTable from "./src/client/StatsTable.js";
import SoundManager from "./src/client/SoundManager.js";
import FightSessionAdapter, {getBoardState} from "./src/client/FightSessionAdapter.js";
import {RESOURCES} from "./src/Constants.js";
import drawHint from "./src/client/ScoreHint.js";
import Api, {authenticate} from "./src/client/Api.js";

const gui = {
    mainGame: document.querySelector('.main-game'),
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    nickNameField: document.querySelector('input.nick-name-field'),
    gameRules: document.querySelector('.game-rules'),
    createLobbyForm: document.querySelector('form.create-lobby'),
    soundSwitches: {
        enabled: document.getElementById('sound-svg-enabled'),
        disabled: document.getElementById('sound-svg-disabled'),
    },
};

let firstBloodSpilled = false;

const setupBoard = async () => {
    Hideable().init();

    const initialBoardState = await getBoardState();
    const fightSession = FightSessionAdapter(initialBoardState);

    [...gui.gameRules.querySelectorAll('[data-balance-value]')].forEach(holder => {
        holder.textContent = initialBoardState.balance[holder.getAttribute('data-balance-value')];
    });

    const matrix = TileMapDisplay(initialBoardState, gui.tileMapHolder);
    const statsTable = StatsTable(gui.playerList, initialBoardState);

    const getTile = ({col, row}) => {
        return (matrix[row] || {})[col] || null;
    };

    const updateComponents = () => {
        TileMapDisplay.updateTilesState(fightSession.getState(), getTile);
        const currentTurnPlayer = fightSession.getState().turnPlayersLeft[0];
        statsTable.update(currentTurnPlayer, fightSession.getState());
    };

    return {fightSession, getTile, updateComponents, statsTable};
};

(async () => {
    const soundManager = SoundManager(gui.soundSwitches);
    const {fightSession, getTile, updateComponents, statsTable} = await setupBoard();

    let releaseInput = () => {};
    // TODO: websockets
    const intervalId = setInterval(async () => {
        if (fightSession.getState().hotSeat) {
            return;
        }
        const updated = await fightSession.checkForUpdates();
        if (updated) {
            updateComponents();
        }
        releaseInput();
        releaseInput = () => {};
    }, 1000);

    const whenAuth = authenticate().then(({user, api}) => {
        let name = user.name;
        gui.nickNameField.value = name;
        gui.nickNameField.addEventListener('blur', async () => {
            if (gui.nickNameField.value !== name) {
                await api.changeUserName({name: gui.nickNameField.value});
                name = gui.nickNameField.value;
            }
        });
        return {user, api};
    });

    gui.createLobbyForm.addEventListener('submit', evt => {
        evt.preventDefault();
        const form = evt.target;
        const lobbyData = {
            name: form.elements['name'].value,
            playerSlots: [...form.querySelectorAll('[data-owner]')]
                .map(slotForm => ({
                    codeName: slotForm.getAttribute('data-owner'),
                    aiBase: slotForm.querySelector('[name="aiBase"]').value,
                    allowPlaceHuman: slotForm.querySelector('[name="allowPlaceHuman"]').checked,
                })),
        };
        console.log('ololo create lobby', lobbyData);
    });

    const processTurn = async (codeName) => {
        while (true) {
            const input = GetTurnInput({
                currentSvgEl: gui.tileMapHolder.querySelector(`[data-stander=${codeName}]`),
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
                const tile = fightSession.getState().tiles.find( t => t.row === newTile.row && t.col === newTile.col );

                if (tile.modifiers.some(mod => RESOURCES.includes(mod)) && lastOwner !== codeName) {
                    drawHint(newTile.svgEl, codeName, `+1`);
                }
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
    };

    await startGame();
    clearInterval(intervalId);
})();
