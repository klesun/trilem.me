import SoundManager from "./SoundManager.js";
import TileMapDisplay from "../TileMapDisplay.js";
import StatsTable from "./StatsTable.js";
import GetTurnInput from "./GetTurnInput.js";
import drawHint from "./ScoreHint.js";
import {RESOURCES} from "../Constants.js";

let releaseInput = () => {};

let firstBloodSpilled = false;

const setupBoard = async ({fightSession, gui}) => {
    const boardState = fightSession.getState();

    [...gui.gameRules.querySelectorAll('[data-balance-value]')].forEach(holder => {
        holder.textContent = boardState.balance[holder.getAttribute('data-balance-value')];
    });

    const matrix = TileMapDisplay(boardState, gui.tileMapHolder);
    const statsTable = StatsTable(gui.playerList, boardState);

    const getTile = ({col, row}) => {
        return (matrix[row] || {})[col] || null;
    };

    return {fightSession, getTile, statsTable};
};

const SetupGame = async ({fightSession, codeName, gui}) => {
    releaseInput();
    const soundManager = SoundManager(gui.soundSwitches);
    const {getTile, statsTable} = await setupBoard({fightSession, gui});

    const updateComponents = (boardState) => {
        TileMapDisplay.updateTilesState(boardState, getTile);
        const currentTurnPlayer = boardState.turnPlayersLeft[0];
        statsTable.update(currentTurnPlayer, boardState);
    };

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
            if (!fightSession.getState().turnPlayersLeft.includes(codeName)) {
                await new Promise((ok) => setTimeout(ok, 50));
                continue; // waiting for other players turns
            }
            gui.turnsLeftHolder.textContent = fightSession.getState().turnsLeft;
            updateComponents(fightSession.getState());

            await processTurn(codeName).catch(exc => {
                alert('Unexpected failure while processing turn - ' + exc);
                throw exc;
            });
        }

        const winners = statsTable.getWinners();

        alert('The winner is ' + winners.join(' and '));
    };

    const updateStateFromServer = async (boardState) => {
        updateComponents(boardState);
        releaseInput();
        releaseInput = () => {};
    };

    const whenFinished = startGame();

    return {
        whenFinished: whenFinished,
        updateStateFromServer: updateStateFromServer,
    };
};

export default SetupGame;