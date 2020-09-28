import {addEvent} from './event';

export function onlyOne(obj) {
    return Array.isArray(obj) ? obj[0] : obj;
}

/*
给真实dom节点赋属性
 */
export function setProps(dom, props) {
    for(let key in props) {
        if(key !== 'children') {
            let value = props[key];
            setProp(dom, key, value);
        }
    }
}

function setProp(dom, key, value) {
    if(/^on/.test(key)) {//如果属性名是以on开头的说明要绑定事件
        // dom[key.toLowerCase()] = value; //改成合成事件
        addEvent(dom,key,value)
    } else if(key === 'style') {
        for(let styleName in value) {
            dom.style[styleName] = value[styleName];
        }
    } else {
        dom.setAttribute(key, value);
    }
}

export function flatten(array){
    let flatted = [];
    if(!Array.isArray(array)){
        return array;
    }
    (function flat(array) {
        array.forEach(item => {
            if(Array.isArray(item)){
                flat(item)
            }else{
                flatted.push(item);
            }
        })
    })(array);
    return flatted;
}
export function isFunction(obj) {
    return typeof obj==='function';
}
//老有新没有，删除       老新都有则更新  老没有新有则增加
export function patchProps(dom,oldProps,newProps) {
    for(let key in oldProps){
        if(key!=='children'){
            if(!newProps.hasOwnProperty(key)){
                dom.removeAttribute(key);
            }
        }
    }
    for(let key in newProps){
        if(key!=='children'){
            setProp(dom,key,newProps[key])
        }
    }
}
