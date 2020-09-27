import {CLASS_COMPONENT, ELEMENT, FUNCTION_COMPONENT, TEXT} from './constants';
import {onlyOne,setProps,flatten} from './utils';


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
    }else if($$typeof===FUNCTION_COMPONENT){
        dom=createFunctionComponentDOM(element);
    }else if($$typeof===CLASS_COMPONENT){
        dom=createClassComponentDOM(element);
    }
    return dom;
}
function createClassComponentDOM(element) {
    let {type,props}=element;
    let componentInstance=new type(props);
    //当创建组件实例之后，把实例添加到虚拟节点上
    element.componentInstance=componentInstance;
    let renderElement=componentInstance.render();
    //在类组件实例上添加renderElement，指向上一次要渲染的虚拟dom节点
    //因为后面组件更新的，我们会重新render，然后跟上一次的renderElement进行dom diff
    componentInstance.renderElement=renderElement;
    let newDOM = createDOM(renderElement);
    renderElement.dom=newDOM;
    //最后生成这样的链式关系element.componentInstance.renderElement.dom=真实dom元素
    return newDOM;
}
//创建函数组件对应的真实的dom对象
function createFunctionComponentDOM(element) {
    let {type,props}=element;
    let renderElement=type(props);
    element.renderElement=renderElement;
    let newDOM=createDOM(renderElement);
    renderElement.dom=newDOM;
    return newDOM;
}
function createNativeDOM(element) {
    let {type,props}=element;
    let dom=document.createElement(type);
    //1.创建此虚拟dom节点的子节点
    createDOMChildren(dom,props.children);
    setProps(dom,props);
    //2.给此dom元素添加属性
    return dom
}
function createDOMChildren(parentNode,children) {
    children&&flatten(children).forEach((child,index)=>{
        //child其实是虚拟dom，会在虚拟dom上加一个属性_mountIndex
        //指向此虚拟dom节点在父节点的索引，在后面做dom-diff时用到
        child._mountIndex=index;
        let childDOM=createDOM(child); //创建子虚拟dom节点的真实dom
        parentNode.appendChild(childDOM)
    })
}
export {
    ReactElement,
    createDOM
};
