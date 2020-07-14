import createDialog from "./Modal.js";
import {Dom} from "./Dom.js";
import Input from "./Input.js";
import Select from "./Select.js";
import {AI_BEHAVIOUR, PLAYER_CODE_NAMES} from "../Constants.js";

let modal;

const getBody = () => {
    const columns = [
        {
            label: 'Lobby Name: ',
            input: Input({autocorrect: "off", spellcheck: false, name: 'lobbyName'}),
        },
        {
            label: 'Play as: ',
            input: Select({
                name: "characterSelect",
                options: PLAYER_CODE_NAMES.map( name => ({label: name, value: name}) ),
            }).context,
        }
    ];

    return Dom('form', {}, [
        Dom('div', {
            class: 'col-grid',
            style: 'min-width: 465px',
        }, columns.map( col => Dom('div', {
            class: 'row-grid a-i-center col-space-sm',
        }, [
            Dom('div', {class: 'col-grid flex-sm'}, [
                Dom('label', {class: 'form-label'}, col.label),
            ]),
            Dom('div', {class: 'col-grid flex-sm'}, [col.input]),
        ]))),
        Dom('div', {class: 'col-grid'}, [
            Dom('div', {
                class: 'row-grid a-i-center col-space-sm j-c-sb no-gutters-side-md',
            }, PLAYER_CODE_NAMES.map( (player, i) => Dom('div', {
                class: 'col-grid player-col m-r-md m-l-md'
            }, [
                Dom('div', {
                    class: `player-container ${player.toLocaleLowerCase()}`,
                    'data-owner': player,
                }, [
                    Dom('div', {class: 'player-title'}, player),
                    Select({
                        name: 'aiBase',
                        wrapperClass: player.toLocaleLowerCase(),
                        options: [
                            {value: AI_BEHAVIOUR.skipTurns, label: "No AI (Skip Turns)"},
                            {value: AI_BEHAVIOUR.pureRandom, label: "Pure Random"},
                            {value: AI_BEHAVIOUR.leasRecentTiles, label: "Least Recent Tiles"},
                            {value: AI_BEHAVIOUR.resourcePathfinding, label: "Resource Pathfinding"},
                        ]
                    }).context,
                    Dom('label', {class: 'allow-player'}, [
                        Dom('span'),
                        Dom('input', {
                            type: 'checkbox',
                            name: 'allowHuman',
                        }, "Allow Players to Join")
                    ]),
                ]),
            ]))),
        ]),
    ]);
};

const getActions = (api, reloadGame, form) => {
    return Dom('div', {class: 'row-grid j-c-right'}, [
        Dom('button', {
            class: 'form-btn',
            onclick: () => {
                const data = {
                    name: form.querySelector('[name="lobbyName"]').value,
                    playAs: form.querySelector('[name="characterSelect"]').value,
                    playerSlots: [...form.querySelectorAll('.player-container')].map( block => ({
                        codeName: block.dataset.owner,
                        aiBase: block.querySelector('[name="aiBase"]').value,
                        allowPlaceHuman: block.querySelector('[name="allowHuman"]').checked,
                    }))
                };

                api.createLobby(data)
                    .then(result => {
                        reloadGame(result);
                        if (modal) {
                            modal.destroy();
                        }
                    })
                    .catch(exc => alert('Failed to create lobby - ' + exc));
            },
        }, "GO"),
    ]);
};

const CreateLobbyDialog = (api, reloadGame) => {
    const form = getBody();
    const config = {
        title: 'CREATE LOBBY',
        body: form,
        actions: getActions(api, reloadGame, form),
    };

    modal = createDialog(config);

    return modal;
};

export default CreateLobbyDialog;