import {Dom} from "./Dom.js";

const Select = props => {
    const options = [].concat(props.options);
    let currentValue = {...options[0]};

    const wrapper = Dom('div', {class: `select-wrapper ${(props.wrapperClass || '')}`});
    const header = Dom('div', {class: 'select-header'});
    const value = Dom('div', {class: 'select-value'});
    const caret = Dom('div', {class: 'select-arrow-icon'}, [
        Dom('i', {class: 'fas fa-caret-down'})
    ]);
    const input = Dom('input', {class: 'select-input', type: 'text', name: props.name});
    const body = Dom('div', {class: 'select-body'});

    const updateValue = (opt) => {
        value.innerHTML = opt.label;
        input.value = opt.value;
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
        caret.children[0].classList.add('fa-caret-up');
        caret.children[0].classList.remove('fa-caret-down');
        document.addEventListener('click', handleClickOutside);
    };

    const handleClose = e => {
        wrapper.classList.remove('active');
        caret.children[0].classList.add('fa-caret-down');
        caret.children[0].classList.remove('fa-caret-up');
        document.removeEventListener('click', handleClickOutside);
    };

    header.addEventListener('click', handleOpen);

    const _getValue = () => {
        return currentValue;
    };

    header.appendChild(value);
    header.appendChild(caret);
    header.appendChild(input);
    wrapper.appendChild(header);
    wrapper.appendChild(body);

    return {
        context: wrapper,
        getValue: _getValue,
    };
};

export default Select;