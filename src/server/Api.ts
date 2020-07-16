import GenerateBoard from "../GenerateBoard";
import * as http from "http";
import {randomBytes} from "crypto";
import FightSession from "../FightSession";
import {BoardState, BoardUuid, CreateLobbyParams, Lobby, PlayerCodeName, UserId, SerialData, User} from "./TypeDefs";
import {PLAYER_CODE_NAMES, PLAYER_KEANU, PLAYER_MORPHEUS, PLAYER_TRINITY} from "../Constants";
import CheckAiTurns from "../common/CheckAiTurns";
import {Socket} from "socket.io";
import bip39 from './../common/bip39.js';
import DefaultBalance from "../DefaultBalance.js";

const Rej = require('klesun-node-tools/src/Rej.js');
const {coverExc} = require('klesun-node-tools/src/Lang.js');

type TimestampMs = number;

const uuidToBoard: Record<BoardUuid, BoardState> = {};
const authTokenToUserId: Record<string, number> = {};
const users: User[] = [];

const boardUuidToLobby: Record<BoardUuid, Lobby> = {};
const userToActivityMs = new Map<UserId, TimestampMs>();

// most likely rather than store mapping with all players, it would be better if each
// player subscribed to topic of his id to not mess with garbage collection manually...
export const playerIdToSocket = new Map<UserId, Set<Socket>>();

const sendToSocket = (userId: number, message: {messageType: string, [k: string]: SerialData}) => {
    const sockets = playerIdToSocket.get(userId) || new Set<Socket>();
    for (const socket of sockets) {
        socket.send(message);
    }
};

const sendStateToSocket = ({boardState, playerId}: {
    boardState: BoardState, playerId: UserId,
}) => {
    sendToSocket(playerId, {messageType: 'updateBoardState', boardState});
};

const setupBoard = (balance = DefaultBalance()) => {
    const board = GenerateBoard(balance);
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

const addUserWithToken = (authToken: string) => {
    const id = users.length + 1;
    const name = bip39.generateUserName(id);
    users.push({name, id});
    authTokenToUserId[authToken] = id;
    return {name, id, isNew: true};
};

const generateAuthToken = () => {
    const authToken = randomBytes(32).toString('hex');
    const {name, id} = addUserWithToken(authToken);
    return {authToken, name, id};
};

const getUserByToken = (authToken: string) => {
    if (!authToken) {
        return Rej.BadRequest('authToken parameter not supplied');
    }
    const id = authTokenToUserId[authToken];
    if (!id) {
        return Rej.NotAuthorized('No users exist with such authToken');
    } else if (!users[id - 1]) {
        return Rej.InternalServerError('No data found for user #' + id);
    } else {
        userToActivityMs.set(id, Date.now());
        return Promise.resolve(users[id - 1]);
    }
};

const validateAuthToken = async (rq: http.IncomingMessage) => {
    const {authToken} = await readJson(rq);
    return getUserByToken(authToken)
        .catch(coverExc([Rej.NotAuthorized], () => {
            return addUserWithToken(authToken);
        }));
};

const changeUserName = async (rq: http.IncomingMessage) => {
    const {authToken, name} = await readJson(rq);
    const user = await getUserByToken(authToken);
    if (!name) {
        return Rej.BadRequest('name parameter not supplied');
    } else if (typeof name !== 'string') {
        return Rej.BadRequest('name must be a string');
    } else if (name.length > 100) {
        return Rej.BadRequest('name length must not exceed 100 characters');
    }
    user.name = name;
    return Promise.resolve(user);
};

const abandonLobby = (user: User, lobby: Lobby) => {
    let lobbiesAbandoned = 0;
    const boardUuid = lobby.boardUuid;
    const codeNames: PlayerCodeName[] = Object
        .keys(boardUuidToLobby[boardUuid].players)
        .map(k => <PlayerCodeName>k);
    for (const codeName of codeNames) {
        if (lobby.players[codeName] === user.id) {
            ++lobbiesAbandoned;
            let boardState = uuidToBoard[lobby.boardUuid];
            delete lobby.players[codeName];
            // finish all pending turns after leaving the lobby
            boardState = CheckAiTurns({boardState, lobby, fight: FightSession({boardState})});
            Object.values(lobby.players)
                .filter(id => id !== user.id)
                .forEach(playerId => sendStateToSocket({boardState, playerId}));
        }
    }
    if (Object.keys(boardUuidToLobby[boardUuid].players).length === 0) {
        delete boardUuidToLobby[boardUuid];
    }
    return lobbiesAbandoned;
};

const abandonAllLobbies = (user: User) => {
    let lobbiesAbandoned = 0;
    for (const [boardUuid, lobby] of Object.entries(boardUuidToLobby)) {
        lobbiesAbandoned += abandonLobby(user, lobby);
    }
    return lobbiesAbandoned;
};

const createLobbyBy = async ({user, params}: {
    user: User, params: CreateLobbyParams,
}) => {
    const board = setupBoard(params.balance);
    const players = <Record<PlayerCodeName, UserId>>{
        [PLAYER_KEANU]: user.id,
    };
    const lobby: Lobby = {
        ...params,
        boardUuid: board.uuid,
        players: players,
        history: [],
    };
    boardUuidToLobby[board.uuid] = lobby;
    return {lobby, board};
};

const createLobby = async (rq: http.IncomingMessage) => {
    const {authToken, ...params} = await readJson(rq);
    const user = await getUserByToken(authToken);
    abandonAllLobbies(user);
    return createLobbyBy({user, params});
};

const joinLobbyBy = async ({user, codeName, lobby}: {
    user: User, codeName: PlayerCodeName, lobby: Lobby,
}) => {
    if (!lobby) {
        return Rej.NotFound('Lobby not found');
    }
    const takenUserId = lobby.players[<PlayerCodeName>codeName];
    if (takenUserId) {
        return Rej.Locked('Slot ' + codeName + ' is already taken by player #' + takenUserId);
    }
    abandonAllLobbies(user);
    lobby.players[<PlayerCodeName>codeName] = user.id;
    return {lobby, board: uuidToBoard[lobby.boardUuid]};
};

const joinLobby = async (rq: http.IncomingMessage) => {
    const {authToken, codeName, boardUuid} = await readJson(rq);
    const user = await getUserByToken(authToken);
    const lobby = boardUuidToLobby[boardUuid];
    return joinLobbyBy({user, codeName, lobby});
};

const getLobby = async (rq: http.IncomingMessage) => {
    const {authToken} = await readJson(rq);
    const user = await getUserByToken(authToken);
    const availableLobbies = [];
    for (const [boardUuid, lobby] of Object.entries(boardUuidToLobby)) {
        const participantIds = Object.values(lobby.players);
        const availableSlots = (<PlayerCodeName[]>PLAYER_CODE_NAMES)
            .filter((codeName) => !lobby.players[codeName]);
        if (participantIds.includes(user.id)) {
            const board = uuidToBoard[boardUuid];
            if (board.turnsLeft <= 0) {
                abandonLobby(user, lobby);
            } else {
                return {lobby, board};
            }
        } else if (availableSlots.length > 0) {
            availableLobbies.push({lobby, availableSlots});
        }
    }
    if (availableLobbies.length > 0) {
        const {lobby, availableSlots} = availableLobbies[0];
        return joinLobbyBy({user, codeName: availableSlots[0], lobby});
    } else {
        return createLobbyBy({
            user, params: {
                name: 'by ' + user.name,
                playerSlots: [
                    {aiBase: 'LEAST_RECENT_TILES', codeName: PLAYER_KEANU},
                    {aiBase: 'LEAST_RECENT_TILES', codeName: PLAYER_TRINITY},
                    {aiBase: 'LEAST_RECENT_TILES', codeName: PLAYER_MORPHEUS},
                ],
                balance: DefaultBalance(),
            }
        })
    }
};

const getFight = async (rq: http.IncomingMessage) => {
    const {uuid, authToken, ...actionParams} = await readJson(rq);
    const boardState = uuidToBoard[uuid];
    if (!boardState) {
        return Rej.NotFound('Board ' + uuid + ' not found');
    }
    const lobby: Lobby | null = boardUuidToLobby[boardState.uuid] || null;
    if (!lobby) {
        return Rej.NotFound('Lobby ' + boardState.uuid + ' does not exist');
    }
    const user = await getUserByToken(authToken);
    const codeName = Object.entries(lobby.players)
        .flatMap(([codeName, id]) => id === user.id ? [codeName] : [])[0];
    if (!codeName) {
        return Rej.BadRequest('You are not participating in this match');
    }
    const fight = FightSession({boardState, history: lobby.history});

    return {fight, user, lobby, codeName, actionParams};
};

const makeTurn = async (rq: http.IncomingMessage) => {
    const {fight, lobby, codeName, actionParams, user} = await getFight(rq);
    let boardState = fight.makeTurn({...actionParams, codeName});
    boardState = CheckAiTurns({boardState, lobby, fight});
    Object.values(lobby.players)
        .filter(id => id !== user.id).map(id => <number>id)
        .forEach(playerId => sendStateToSocket({boardState, playerId}));
    return boardState;
};

const skipTurn = async (rq: http.IncomingMessage) => {
    const {fight, lobby, codeName, actionParams, user} = await getFight(rq);
    let boardState = fight.skipTurn({...actionParams, codeName});
    boardState = CheckAiTurns({boardState, lobby, fight});
    Object.values(lobby.players)
        .filter(id => id !== user.id).map(id => <number>id)
        .forEach(playerId => sendStateToSocket({boardState, playerId}));
    return boardState;
};

const getLobbyList = (rq: http.IncomingMessage) => ({
    boardUuidToLobby: boardUuidToLobby,
    uuidToBoard: uuidToBoard,
    users: users,
});

export type GetLobbyListResult = ReturnType<typeof getLobbyList>;

const routes: Record<string, (rq: http.IncomingMessage) => Promise<SerialData> | SerialData> = {
    // auth required API-s
    '/api/generateAuthToken': generateAuthToken,
    '/api/validateAuthToken': validateAuthToken,
    '/api/changeUserName': changeUserName,
    '/api/createLobby': createLobby,
    '/api/joinLobby': joinLobby,
    '/api/getLobby': getLobby,
    '/api/makeTurn': makeTurn,
    '/api/skipTurn': skipTurn,

    // no auth API-s
    '/api/setupBoard': () => setupBoard(),
    '/api/getLobbyList': getLobbyList,
};

const Api = {
    routes: routes,
};

export default Api;

const MAX_AFK_MS = 10 * 60 * 1000;

setInterval(() => {
    // would be nice to have some sorted structure, maybe even
    // in redis, but for now, nah, linear search for the win
    for (const [userId, activityMs] of userToActivityMs) {
        const afkMs = Date.now() - activityMs;
        if (afkMs > MAX_AFK_MS) {
            const user = users[userId - 1];
            const lobbiesAbandoned = abandonAllLobbies(user);
            if (lobbiesAbandoned > 0) {
                sendToSocket(userId, {
                    messageType: 'kickedFromLobbyForAfk',
                    afkMs, maxAfkMs: MAX_AFK_MS,
                });
            }
            userToActivityMs.delete(userId);
        }
    }
}, MAX_AFK_MS);