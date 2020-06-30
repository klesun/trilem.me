import {Dom} from "./Dom.js";
import {PLAYER_CODE_NAMES} from "../Constants.js";

const Select = props => {
    const options = PLAYER_CODE_NAMES.map( name => ({label: name, value: name}) );
    let currentValue = {...options[0]};

    const wrapper = Dom('div', {class: 'select-wrapper'});
    const header = Dom('div', {class: 'select-header'});
    const value = Dom('div', {class: 'select-value'});
    const caret = Dom('div', {class: 'select-arrow-icon'}, [
        Dom('i', {class: 'fas fa-caret-down'})
    ]);
    const input = Dom('input', {class: 'select-input', type: 'text'});
    const body = Dom('div', {class: 'select-body'});

    const updateValue = (opt) => {
        value.innerHTML = opt.label;
        currentValue = {...opt};
    };

    updateValue(currentValue);

    const handleSelect = (e, opt) => {
        handleClose();
        updateValue(opt);
    };

    options.forEach( opt => {
        const option = Dom('div', {class: 'select-option'});
        option.innerHTML = opt.label;
        option.addEventListener('click', e => handleSelect(e, opt));
        body.appendChild(option);
    } );

    const handleClickOutside = e => {
        if (!wrapper.contains(e.target)) {
            handleClose();
        }
    };

    const handleOpen = e => {
        wrapper.classList.add('active');
        document.addEventListener('click', handleClickOutside);
    };

    const handleClose = e => {
        wrapper.classList.remove('active');
        document.removeEventListener('click', handleClickOutside);
    };

    header.addEventListener('click', handleOpen);

    const _getValue = () => {
        return currentValue;
    };

    header.appendChild(value);
    header.appendChild(caret);
    wrapper.appendChild(header);
    wrapper.appendChild(body);

    return {
        context: wrapper,
        getValue: _getValue,
    };
};

export default Select;