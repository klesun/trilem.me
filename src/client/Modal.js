import {Dom} from "./Dom.js";

function createDialog ({title = 'Title', body = null, actions = null}) {
    // dialog template
    const backdrop = Dom('div', {class: 'dialog-backdrop'});
    const contentBlock = Dom('div', {class: 'dialog-content'});
    const container = Dom('div', {class: 'dialog-container'}, [contentBlock]);
    const dialog = Dom('div', {class: 'dialog-wrapper'}, [backdrop, container]);

    // title, body, actions
    const titleBlock = Dom('div', {class: 'dialog-title'});
    const bodyBlock = Dom('div', {class: 'dialog-body'});
    const actionsBlock = Dom('div', {class: 'dialog-actions'});

    const fillData = () => {
        if (typeof title !== "string") {
            throw new Error('Dialog title should be a text value');
        }

        const blocks = [{block: bodyBlock, data: body}, {block: actionsBlock, data: actions}];
        const text = Dom('h2', {class: 'dialog-title-text'});
        text.innerHTML = title;
        titleBlock.appendChild(text);

        blocks.forEach( val => {
            if (!val.data)
                return;

            if (['string', 'number'].includes(typeof val.data)) {
                val.block.innerHTML = val.data;
            } else if (val.data.length) {
                val.data.forEach( block => val.block.appendChild(block) );
            } else {
                val.block.appendChild(val.data);
            }
        } );
    };

    const closeDialog = e => {
        if (!contentBlock.contains(e.target)) {
            _destroy();
        }
    };

    function _show() {
        document.body.appendChild(dialog);
        document.body.classList.add('show-dialog');
        document.addEventListener('mousedown', closeDialog);
    }

    function _destroy() {
        document.body.removeChild(dialog);
        document.body.classList.remove('show-dialog');
        document.removeEventListener('mousedown', closeDialog);
    }

    fillData();

    [titleBlock, bodyBlock, actionsBlock].forEach( block => contentBlock.appendChild(block) );

    return {
        context: dialog,
        show: _show,
        destroy: _destroy,
    }
}

export default createDialog;