import {ELEMENT, TEXT} from './constants';
import {onlyOne,setProps} from './utils';


function ReactElement($$typeof, type, key, ref, props) {
    let element = {
        $$typeof, type, key, ref, props
    };
    return element;
}

// 把虚拟dom变成真实dom
function createDOM(element) {
    element = onlyOne(element);
    let {$$typeof} = element;
    let dom = null;
    if(!$$typeof) { // 如果没有类型，说明ReactDOM.render的第一个参数是文本
        dom = document.createTextNode(element);
    } else if($$typeof === TEXT) {
        dom = document.createTextNode(element.content);
    }else if($$typeof === ELEMENT){
        dom =createNativeDOM(element)
    }
    return dom;
}
function createNativeDOM(element) {
    let {type,props}=element
    let dom=document.createElement(type);
    //1.创建此虚拟dom节点的子节点
    createNativeDOMChildren(dom,props.children);
    setProps(dom,props);
    //2.给此dom元素添加属性
    return dom
}
function createNativeDOMChildren(parentNode,children) {
    children&&children.flat(Infinity).forEach(child=>{
        let childDOM=createDOM(child) //创建子虚拟dom节点的真实dom
        parentNode.appendChild(childDOM)
    })
}
export {
    ReactElement,
    createDOM
};
