import Api from "./Api.js";
import GenerateBoard from "../GenerateBoard.js";
import FightSession from "../FightSession.js";


const api = Api();

const ONLY_HOT_SEAT = false;

/** @return {BoardState} */
export const getBoardState = async () => {
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

/**
 * encapsulates the communication with server that can
 * be transparently switched to offline hot-seat game
 *
 * @param {BoardState} boardState
 * @param matrix = TileMapDisplay()
 */
const FightSessionAdapter = ({initialBoardState, matrix}) => {
    let boardState = initialBoardState;

    const makeTurn = async (codeName, newTile) => {
        /** @type {MakeTurnParams} */
        const params = {
            uuid: initialBoardState.uuid,
            codeName: codeName,
            col: newTile.col,
            row: newTile.row,
        };
        if (!initialBoardState.hotSeat) {
            return boardState = await api.makeTurn(params);
        } else {
            return boardState = await FightSession({boardState}).makeTurn(params);
        }
    };

    const skipTurn = async (codeName) => {
        const params = {
            uuid: initialBoardState.uuid,
            codeName: codeName,
        };
        if (!boardState.hotSeat) {
            return boardState = await api.skipTurn(params);
        } else {
            return boardState = await FightSession({boardState}).skipTurn(params);
        }
    };

    const getTile = ({col, row}) => {
        return (matrix[row] || {})[col] || null;
    };

    const checkForUpdates = async () => {
        boardState = await api.getBoardState({uuid: initialBoardState.uuid});
        return true; // should eventually return false if no changes happened
    };

    return {
        makeTurn: makeTurn,
        skipTurn: skipTurn,
        getPossibleTurns: (codeName) => FightSession({boardState})
            .getPossibleTurns(codeName)
            .map(getTile),
        getTile: getTile,
        getState: () => boardState,
        checkForUpdates: checkForUpdates,
    };
};

export default FightSessionAdapter;