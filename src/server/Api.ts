import GenerateBoard from "../GenerateBoard";
import * as http from "http";
import {randomBytes} from "crypto";
import FightSession from "../FightSession";
import {
    BUFF_SKIP_TURN,
    NO_RES_DEAD_SPACE, NO_RES_EMPTY,
    PLAYER_KEANU,
    PLAYER_MORPHEUS,
    PLAYER_TRINITY,
    RES_GOLD,
    RES_OIL,
    RES_WHEAT
} from "../Constants";

const Rej = require('klesun-node-tools/src/Rej.js');

type BoardUuid = string;
type PlayerCodeName = typeof PLAYER_KEANU | typeof PLAYER_TRINITY | typeof PLAYER_MORPHEUS;
type Resource = typeof RES_WHEAT | typeof RES_OIL | typeof RES_GOLD;
type TileModifier = Resource | typeof NO_RES_DEAD_SPACE | typeof NO_RES_EMPTY;
type PlayerBuff = typeof BUFF_SKIP_TURN;

interface BoardState {
    uuid: BoardUuid,
    totalRows: number,
    totalTurns: number,

    turnsLeft: number,
    turnPlayersLeft: PlayerCodeName[],
    playerToPosition: Record<PlayerCodeName, {col: number, row: number}>,
    playerToBuffs: Record<PlayerCodeName, PlayerBuff[]>,
    tiles: {
        col: number,
        row: number,
        modifier: TileModifier,
        owner: PlayerCodeName,
    }[],

    balance: Record<string, any>,
}

interface MakeTurnParams {
    uuid: BoardUuid,
    codeName: PlayerCodeName,
    col: number,
    row: number,
}

interface User {
    name: string,
}

type Primitive = number | string | boolean;
type SerialData = Primitive | {[k: string]: SerialData} | {[k: number]: SerialData};

const uuidToBoard: Record<BoardUuid, BoardState> = {};
const authTokenToUser: Record<string, User> = {};

const setupBoard = () => {
    const board = GenerateBoard();
    uuidToBoard[board.uuid] = board;
    return board;
};

const readPost = (rq: http.IncomingMessage) => new Promise<string>((ok, err) => {
    if (rq.method === 'POST') {
        let body = '';
        rq.on('data', (data: string) => body += data);
        rq.on('error', (exc: any) => err(exc));
        rq.on('end', () => ok(body));
    } else {
        ok('');
    }
});

const readJson = async (rq: http.IncomingMessage) => {
    const postStr = await readPost(rq);
    if (!postStr) {
        const msg = 'POST body missing, must be a JSON string';
        return Rej.BadRequest(msg);
    }
    return JSON.parse(postStr);
};

const generateAuthToken = () => {
    const authToken = randomBytes(32).toString('hex');
    const name = 'anon' + Object.keys(authTokenToUser).length;
    authTokenToUser[authToken] = {name};
    return {
        authToken: authToken,
        name: name,
    };
};

const validateAuthToken = async (rq: http.IncomingMessage) => {
    const {authToken} = await readJson(rq);
    if (!authToken) {
        return Rej.BadRequest('authToken parameter not supplied');
    }
    const user = authTokenToUser[authToken];
    if (!user) {
        return Rej.NotAuthorized('No users exist with such authToken');
    } else {
        return Promise.resolve(user);
    }
};

const changeUserName = async (rq: http.IncomingMessage) => {
    const {authToken, name} = await readJson(rq);
    if (!authToken) {
        return Rej.BadRequest('authToken parameter not supplied');
    } else if (!name) {
        return Rej.BadRequest('name parameter not supplied');
    } else if (typeof name !== 'string') {
        return Rej.BadRequest('name must be a string');
    } else if (name.length > 100) {
        return Rej.BadRequest('name length must not exceed 100 characters');
    }
    const user = authTokenToUser[authToken];
    if (!authTokenToUser[authToken]) {
        return Rej.NotAuthorized('No users exist with such authToken');
    } else {
        authTokenToUser[authToken].name = name;
        return Promise.resolve(user);
    }
};

const getFight = async (rq: http.IncomingMessage) => {
    const {uuid, ...actionParams} = await readJson(rq);
    const boardState = uuidToBoard[uuid];
    if (!boardState) {
        return Rej.NotFound('Board ' + uuid + ' not found');
    }
    const fight = FightSession({boardState, Rej});

    return {fight, actionParams};
};

const makeTurn = async (rq: http.IncomingMessage) => {
    const {fight, actionParams} = await getFight(rq);
    return fight.makeTurn(actionParams);
};

const skipTurn = async (rq: http.IncomingMessage) => {
    const {fight, actionParams} = await getFight(rq);
    return fight.skipTurn(actionParams);
};

const getBoardState = (rq: http.IncomingMessage) => {
    const urlObj = new URL('https://zhopa.com' + rq.url).searchParams;
    const uuid = urlObj.get('uuid');
    if (uuid) {
        if (uuidToBoard[uuid]) {
            return uuidToBoard[uuid];
        } else {
            return Rej.NotFound('Board ' + uuid + ' not found');
        }
    }
    const firstBoard = Object.values(uuidToBoard)[0];
    if (firstBoard) {
        if (firstBoard.turnsLeft <= 0) {
            delete uuidToBoard[firstBoard.uuid];
        } else {
            return firstBoard;
        }
    }
    return setupBoard();
};

const routes: Record<string, (rq: http.IncomingMessage) => Promise<SerialData> | SerialData> = {
    '/api/generateAuthToken': generateAuthToken,
    '/api/validateAuthToken': validateAuthToken,
    '/api/changeUserName': changeUserName,
    '/api/getBoardState': getBoardState,
    '/api/setupBoard': setupBoard,
    '/api/getBoardList': async (rq) => ({boards: uuidToBoard}),
    '/api/makeTurn': makeTurn,
    '/api/skipTurn': skipTurn,
};

const Api = {
    routes: routes,
};

export default Api;