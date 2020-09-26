import {TEXT, ELEMENT} from './constants';
import {ReactElement} from './vdom';

function createElement(type, config = {}, ...children) {
    delete config.__source;
    delete config.__self;
    let {key, ref, ...props} = config;
    let $$typeof = null;
    if(typeof type === 'string') {
        $$typeof = ELEMENT; //是原生dom类型
    }
    props.children = children.map(item => {
        if(typeof item === 'object') {
            return item;
        } else {
            // 如果是文本的话，包装一下
            return {$$typeof: TEXT, type: TEXT, content: item};
        }
    });
    return ReactElement($$typeof, type, key, ref, props);
}

const React = {
    createElement
};
export default React;
