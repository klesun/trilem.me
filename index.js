
import {PLAYER_KEANU, PLAYER_MORPHEUS, PLAYER_TRINITY} from "./src/Constants.js";
import Api, {authenticate} from "./src/client/Api.js";
import {Dom} from "./src/client/Dom.js";
import SetupGame from "./src/client/SetupGame.js";
import Hideable from "./src/client/Hideable.js";
import FightSessionAdapter from "./src/client/FightSessionAdapter.js";

const gui = {
    mainGame: document.querySelector('.main-game'),
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    lobbyList: document.querySelector('tbody.lobby-list'),
    nickNameField: document.querySelector('input.nick-name-field'),
    gameRules: document.querySelector('.game-rules'),
    createLobbyFormFlag: document.querySelector('#show-create-lobby-form'),
    createLobbyForm: document.querySelector('form.create-lobby'),
    soundSwitches: {
        enabled: document.getElementById('sound-svg-enabled'),
        disabled: document.getElementById('sound-svg-disabled'),
    },
};

const updateLobbyOptions = (user) => new Promise((resolve, reject) => {
    return Api().getLobbyList().then((result) => {
        gui.lobbyList.innerHTML = '';
        for (const [boardUuid, lobby] of Object.entries(result.boardUuidToLobby)) {
            const makeSlot = codeName => {
                const userId = lobby.players[codeName];
                const alreadyJoined = Object.values(lobby.players).includes(user.id);
                return userId
                    ? Dom('span', {}, result.users[userId - 1].name) : alreadyJoined
                        ? Dom('span', {}, 'AI')
                        : Dom('button', {
                            class: 'beautiful-btn',
                            onclick: () => resolve({codeName, boardUuid}),
                        }, 'Join');
            };
            gui.lobbyList.appendChild(Dom('tr', {}, [
                Dom('td', {}, lobby.name),
                Dom('td', {}, [makeSlot(PLAYER_KEANU)]),
                Dom('td', {}, [makeSlot(PLAYER_TRINITY)]),
                Dom('td', {}, [makeSlot(PLAYER_MORPHEUS)]),
            ]));
        }
    });
});

let cleanupLastGame = () => {};

/**
 * @param {Lobby} lobby
 * @param {User} user
 * @param {BoardState} board
 */
const setupGame = async ({user, api, lobby, board}) => {
    cleanupLastGame();
    const fightSession = FightSessionAdapter({initialBoardState: board, api});
    const codeName = Object.entries(lobby.players)
        .flatMap(([k,v]) => v === user.id ? [k] : [])[0];

    const game = await SetupGame({fightSession, codeName, gui});

    // TODO: websockets
    const intervalId = setInterval(async () => {
        if (fightSession.getState().hotSeat) {
            return;
        }
        const newState = await Api()
            .getBoardState({uuid: board.uuid});
        fightSession.setState(newState);
        game.updateStateFromServer(newState);
    }, 1000);
    cleanupLastGame = () => clearInterval(intervalId);
};

(async () => {
    Hideable().init();

    const {user, api} = await authenticate().then(({user, api}) => {
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

    const updateLobbies = () => updateLobbyOptions(user)
        .then(api.joinLobby)
        .then(reloadGame);

    setInterval(updateLobbies, 5000);

    const reloadGame = ({lobby, board}) => {
        updateLobbies();
        setupGame({user, api, lobby, board});
    };

    gui.createLobbyForm.addEventListener('submit', evt => {
        evt.preventDefault();
        const form = evt.target;
        /** @type {CreateLobbyParams} */
        const lobbyData = {
            name: form.elements['name'].value,
            playerSlots: [...form.querySelectorAll('[data-owner]')]
                .map(slotForm => ({
                    codeName: slotForm.getAttribute('data-owner'),
                    aiBase: slotForm.querySelector('[name="aiBase"]').value,
                    allowPlaceHuman: slotForm.querySelector('[name="allowPlaceHuman"]').checked,
                })),
        };
        api.createLobby(lobbyData)
            .then(result => {
                gui.createLobbyFormFlag.checked = false;
                reloadGame(result);
            })
            .catch(exc => alert('Failed to create lobby - ' + exc));
    });

    api.getLobby().then(reloadGame);
})();
