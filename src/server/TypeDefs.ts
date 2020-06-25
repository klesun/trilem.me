import {
    BUFF_SKIP_TURN,
    MOD_WALL,
    NO_RES_DEAD_SPACE,
    PLAYER_KEANU,
    PLAYER_MORPHEUS,
    PLAYER_TRINITY,
    RES_GOLD,
    RES_OIL,
    RES_WHEAT
} from "../Constants";

export type BoardUuid = string;
export type PlayerId = number;
export type PlayerCodeName = typeof PLAYER_KEANU | typeof PLAYER_TRINITY | typeof PLAYER_MORPHEUS;
export type Resource = typeof RES_WHEAT | typeof RES_OIL | typeof RES_GOLD;
export type TileModifier = Resource | typeof NO_RES_DEAD_SPACE | typeof MOD_WALL;
export type PlayerBuff = typeof BUFF_SKIP_TURN;

export interface Tile {
    col: number,
    row: number,
    modifiers: TileModifier[],
    owner: PlayerCodeName,
}

export type BoardState = SerialData & {
    uuid: BoardUuid,
    totalRows: number,
    totalTurns: number,

    turnsLeft: number,
    turnPlayersLeft: PlayerCodeName[],
    playerToPosition: Record<PlayerCodeName, {col: number, row: number}>,
    playerToBuffs: Record<PlayerCodeName, PlayerBuff[]>,
    tiles: Tile[],

    balance: Record<string, any>,
}

export interface MakeTurnParams {
    uuid: BoardUuid,
    codeName: PlayerCodeName,
    col: number,
    row: number,
}

export interface AiPlayerSlot {
    codeName: PlayerCodeName,
    aiBase: 'SKIP_TURNS' |  'PURE_RANDOM' | 'LEAST_RECENT_TILES' | 'RESOURCE_PATHFINDING',
}

export interface CreateLobbyParams {
    name: string,
    playerSlots: AiPlayerSlot[],
}

export type Lobby = CreateLobbyParams & {
    boardUuid: BoardUuid,
    players: Record<PlayerCodeName, PlayerId>,
    history: {codeName: PlayerCodeName, row: number, col: number}[],
};

export interface User {
    name: string,
    id: PlayerId,
}

export type Primitive = number | string | boolean;
export type SerialData = Primitive | {[k: string]: SerialData} | {[k: number]: SerialData};