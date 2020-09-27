import {TEXT, ELEMENT, CLASS_COMPONENT, FUNCTION_COMPONENT} from './constants';
import {ReactElement} from './vdom';
import {Component} from './component';

function createElement(type, config = {}, ...children) {
    delete config.__source;
    delete config.__self;
    let {key, ref, ...props} = config;
    let $$typeof = null;
    if(typeof type === 'string') {
        $$typeof = ELEMENT; //是原生dom类型
    }else if (typeof type==='function'&&type.prototype.isReactComponent){
        $$typeof =CLASS_COMPONENT;
    }else if(typeof type==='function'){
        $$typeof =FUNCTION_COMPONENT;
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
export {Component}
const React = {
    createElement,
    Component
};
export default React;
