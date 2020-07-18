
import {PLAYER_KEANU, PLAYER_MORPHEUS, PLAYER_TRINITY} from "./src/Constants.js";
import Api, {authenticate} from "./src/client/Api.js";
import {Dom} from "./src/client/Dom.js";
import StartGame from "./src/client/StartGame.js";
import Hideable from "./src/client/Hideable.js";
import FightSessionAdapter from "./src/client/FightSessionAdapter.js";
import CreateLobbyDialog from "./src/client/CreateLobbyDialog.js";

const gui = {
    mainGame: document.querySelector('.main-game'),
    tileMapWrap: document.querySelector('.tile-map-wrap'),
    tileMapHolder: document.querySelector('.tile-map-holder'),
    turnsLeftHolder: document.querySelector('.turns-left-holder'),
    playerList: document.querySelector('.player-list'),
    lobbyList: document.querySelector('tbody.lobby-list'),
    nickNameField: document.querySelector('input.nick-name-field'),
    gameRules: document.querySelector('.game-rules'),
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

    const game = await StartGame({fightSession, codeName, gui});

    cleanupLastGame = () => {
        game.discard();
    };
    return {
        setState: newState => {
            fightSession.setState(newState);
            game.updateStateFromServer(newState);
        },
    };
};

const initSocket = ({user, setState}) => new Promise((resolve, reject) => {
    const socketIo = window.io('/', {secure: true, transport: ['websocket']});
    socketIo.on('message', (data, reply) => {
        if (data.messageType === 'updateBoardState') {
            setState(data.boardState);
            // no reply, cuz server is not requesting it
        } else if (data.messageType === 'kickedFromLobbyForAfk') {
            alert(`You were kicked from lobby for being AFK for ${Math.floor(data.afkMs / 1000)} seconds which is >= ${Math.floor(data.maxAfkMs / 1000)} seconds`);
        } else {
            console.log('Unexpected message from server', data);
            reply({status: 'UNEXPECTED_MESSAGE_TYPE'});
        }
    });
    socketIo.on('connect', () => {
        socketIo.send({
            messageType: 'subscribePlayer',
            playerId: user.id,
        }, (response) => {
            if (response.status === 'SUCCESS') {
                console.log('server acknowledges your player id', response);
                resolve(socketIo);
            } else {
                reject('Failed to subscribe player - ' + JSON.stringify(response));
            }
        });
    });
    socketIo.on('error', (exc) => {
        reject(exc);
    });
});

/**
 * @param {Touch} lastTouch
 * @param {Touch} newTouch
 */
const getSwipePoint = (lastTouch, newTouch) => {
    const x = lastTouch.clientX;
    const y = lastTouch.clientY;
    const dx = newTouch.clientX - x;
    const dy = newTouch.clientY - y;
    return {x, y, dx, dy};
};

const addDragScroll = () => {
    // const draggableCam = new window.ScrollBooster({
    //     viewport: document.querySelector('.tile-map-wrap'),
    //     content: document.querySelector('.center-svg-root'),
    //     scrollMode: 'native',
    //     direction: 'all',
    //     bounce: false,
    //     friction: 0.999,
    // });

    // no option to disable animation in ScrollBooster it seems...

    let mouseDown = false;
    const setMouseDown = (flag) => {
        mouseDown = flag;
    };
    const scrollDown = dy => {
        const was = gui.tileMapWrap.scrollTop;
        gui.tileMapWrap.scrollTop -= dy;
        const now = gui.tileMapWrap.scrollTop;
        if (was === now) {
            // if we reached the edge of the map, scroll parent like you would normally on a webpage when hitting
            document.body.scrollTop -= dy;
        }
    };
    gui.tileMapWrap.addEventListener('mousedown', () => setMouseDown(true));
    gui.tileMapWrap.addEventListener('mouseup', () => setMouseDown(false));
    gui.tileMapWrap.addEventListener('mouseleave', () => setMouseDown(false));
    gui.tileMapWrap.addEventListener('mousemove', (evt) => {
        if (mouseDown) {
            gui.tileMapWrap.scrollLeft -= evt.movementX;
            scrollDown(evt.movementY);
        }
    });

    // mobile
    /** @type {TouchList[] | Touch[]} */
    let lastTouches = [];
    gui.tileMapWrap.addEventListener('touchstart', (evt) => lastTouches = evt.touches);
    gui.tileMapWrap.addEventListener('touchend', (evt) => lastTouches = []);
    gui.tileMapWrap.addEventListener('touchmove', (evt) => {
        if (lastTouches.length === 1 && evt.touches.length == 1) {
            const {dx, dy} = getSwipePoint(lastTouches[0], evt.touches[0]);
            gui.tileMapWrap.scrollLeft -= dx;
            scrollDown(dy);
        }
        lastTouches = evt.touches;
    }, false);
};

(async () => {
    Hideable().init();
    let whenGameSetup = Promise.reject('Game not initialized yet');

    // init particles
    // temporarily disabled because it causes 25% CPU usage on the chrome tab with a quadcore
    // if you want to stick with particles, please find a way to not eat up a considerable part of system's CPU, maybe slow
    // down the animation or decrease amount of particles and possibly compensate by increasing their size
    // (also, particles.js seems to do rendering on CPU rather than GPU, maybe it's not the best lib?)
    //window.particlesJS.load('particles', './particlesjs-config.json', function() {
    //    console.log('callback - particles.js config loaded');
    //});

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

    initSocket({
        user, setState: newState => {
            return whenGameSetup.then(
                setup => setup.setState(newState)
            );
        },
    }).catch(exc => alert('Failed to initialize web socket - ' + exc));

    const updateLobbies = () => updateLobbyOptions(user)
        .then(api.joinLobby)
        .then(reloadGame);

    setInterval(updateLobbies, 5000);

    const reloadGame = ({lobby, board}) => {
        updateLobbies();
        whenGameSetup = setupGame({user, api, lobby, board});
    };

    document.querySelector('button.create-lobby').addEventListener('click', () => {
        const dialog = CreateLobbyDialog({user, api, reloadGame});
        dialog.show();
        dialog.form.elements['name'].focus();
    });
    addDragScroll();

    api.getLobby().then(reloadGame);
})();
