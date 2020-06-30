import createDialog from "./Modal.js";
import {Dom} from "./Dom.js";
import Input from "./Input.js";
import Select from "./Select.js";


const getBody = () => {
    const columns = [
        {
            label: 'Lobby Name: ',
            input: Input({autocorrect: "off", spellcheck: false})
        },
        {
            label: 'Play as: ',
            input: Select().context,
        }
    ];

    const form = Dom('div', {class: 'col-grid'});

    const rows = columns.map( col => {
        const row = Dom('div', {class: 'row-grid a-i-center col-space-sm'});
        const label = Dom('label', {class: 'form-label'});
        label.innerHTML = col.label;

        const leftCol = Dom('div', {class: 'col-grid flex-sm'});
        leftCol.appendChild(label);

        const rightCol = Dom('div', {class: 'col-grid flex-sm'});
        rightCol.appendChild(col.input);

        row.appendChild(leftCol);
        row.appendChild(rightCol);

        return row;
    } );

    rows.forEach( row => form.appendChild(row) );

    return form;
};

const getActions = () => {
    const container = Dom('div', {class: 'row-grid j-c-right'});
    const createBtn = Dom('button', {class: 'form-btn'});

    createBtn.innerHTML = "GO";
    container.appendChild(createBtn);

    return container;
};

const CreateLobbyDialog = () => {
    const config = {
        title: 'CREATE LOBBY',
        body: getBody(),
        actions: getActions(),
    };


    return createDialog(config);
};

export default CreateLobbyDialog;