import {CLASS_COMPONENT, ELEMENT, FUNCTION_COMPONENT, INSERT, MOVE, REMOVE, TEXT} from './constants';
import {onlyOne, setProps, flatten,patchProps} from './utils';
let updateDepth = 0;// 更新层度
let diffQueue=[];//这是一个补丁包，记录了哪些节点需要删除，哪些节点需要添加
export function compareTwoElements(oldRenderElement, newRenderElement) {
    oldRenderElement = onlyOne(oldRenderElement);
    newRenderElement = onlyOne(newRenderElement);
    let currentDOM = oldRenderElement.dom;
    let currentElement = oldRenderElement;
    if(newRenderElement == null) {
        currentDOM.parentNode.removeChild(currentDOM);
        currentDOM = null;
    } else if(oldRenderElement.type != newRenderElement.type) {
        let newDOM = createDOM(newRenderElement);
        currentDOM.parentNode.replaceChild(newDOM, currentDOM);
        currentElement = newRenderElement;
    } else {//新老节都有，并且类型一样，就要dom diff了,深度比较，还要比较它们的子节点，尽可能复用老节点
        /*let newDOM=createDOM(newRenderElement);
        currentDOM.parentNode.replaceChild(newDOM,currentDOM);
        currentElement=newRenderElement*/
        updateElement(oldRenderElement, newRenderElement);
    }
    return currentElement;
}
function updateElement(oldElement, newElement) {
    let currentDOM=newElement.dom=oldElement.dom;
    if(oldElement.$$typeof===TEXT&&newElement.$$typeof===TEXT){
        if(oldElement.content!==newElement.content){
            currentDOM.textContent=newElement.content;
        }
    }else if(oldElement.$$typeof===ELEMENT){
        updateDOMProperties(currentDOM,oldElement.props,newElement.props);
        updateChildrenElements(currentDOM,oldElement.props.children,newElement.props.children)
        oldElement.props=newElement.props;
    }else if(oldElement.$$typeof===FUNCTION_COMPONENT){
        updateFunctionComponent(oldElement, newElement);
    }else if(oldElement.$$typeof===CLASS_COMPONENT){
        updateClassComponent(oldElement, newElement);
    }
}
function updateChildrenElements(dom,oldChildrenElements,newChildrenElements) {
    updateDepth++;//每进入一个新的子层级
    diff(dom,oldChildrenElements,newChildrenElements);
    updateDepth--;//每进比较完一层，返回上一级的时候
    if(updateDepth===0){//说明比较完了
        patch(diffQueue);//把收集到的补丁传给patch方法进行更新
        diffQueue.length = 0;
    }
}
function patch(diffQueue){}
function diff(parentNode,oldChildrenElements,newChildrenElements){
    let oldChildrenElementsMap=getChildrenElementsMap(oldChildrenElements);
    let newChildrenElementsMap = getNewChildrenElementsMap(oldChildrenElementsMap,newChildrenElements);
    let lastIndex = 0;
    for(let i=0;i<newChildrenElements.length;i++){
        let newChildElement = newChildrenElements[i];
        if(newChildElement){
            let newKey = newChildElement.key||i.toString();
            let oldChildElement=oldChildrenElementsMap[newKey];
            if(newChildElement===oldChildElement){
                if(oldChildElement._mountIndex<lastIndex){
                    diffQueue.push({
                        parentNode,
                        type:MOVE,
                        fromIndex:oldChildElement._mountIndex,
                        toIndex: i
                    })
                }
                lastIndex = Math.max(oldChildElement._mountIndex,lastIndex)
            }else{//如果新老元素不相等，直接插入
                diffQueue.push({
                    parentNode,
                    type:INSERT,
                    toIndex:i,
                    dom:createDOM(newChildElement)
                });
                newChildElement._mountIndex=i;
            }
        }
        for (let oldKey in oldChildrenElementsMap){
            if(!newChildrenElementsMap.hasOwnProperty(oldKey)){
                let oldChildElement = oldChildrenElementsMap[oldKey];
                diffQueue.push({
                    parentNode,
                    type:REMOVE,
                    fromIndex:oldChildElement._mountIndex
                })
            }
        }
    }
}
function getNewChildrenElementsMap(oldChildrenElementsMap,newChildrenElements) {
    let newChildrenElementsMap={};
    for(let i=0;i<newChildrenElements.length;i++){
        let newChildElement = newChildrenElements[i];
        if(newChildElement){//说明新节点不为null
            let newKey=newChildElement.key||i.toString();
            let oldChildElement=oldChildrenElementsMap[newKey];
            //旧节点复用的条件是key一样并且标签类型也要一样
            if(canDeepCompare(oldChildElement,newChildElement)){
                updateElement(oldChildElement,newChildElement);
                newChildrenElements[i]=oldChildElement;
            }
            newChildrenElementsMap[newKey]=newChildrenElements[i];
        }
    }
}
function canDeepCompare(oldChildElement,newChildrenElement) {
    if(!!oldChildElement&&!!newChildrenElement){
        return oldChildElement.type===newChildrenElement.type;
    }
    return false;
}
function getChildrenElementsMap(oldChildrenElements) {
    let oldChildrenElementsMap={};
    for(let i=0;i<oldChildrenElements.length;i++){
        let oldKey=oldChildrenElements[i].key||i.toString();
        oldChildrenElementsMap[oldKey]=oldChildrenElements[i];
    }
    return oldChildrenElementsMap;
}
function updateClassComponent(oldElement, newElement) {
    let componentInstance=oldElement.componentInstance;
    let $updater=componentInstance.$updater;
    let nextProps=newElement.props;
    $updater.emitUpdate(nextProps);
}
function updateFunctionComponent(oldElement, newElement) {
    let oldRenderElement=oldElement.renderElement;
    let newRenderElement=newElement.type(newElement.props);
    let currentElement=compareTwoElements(oldRenderElement,newRenderElement);
    newElement.renderElement = currentElement;
    return currentElement;
}
function updateDOMProperties(dom,oldProps,newProps) {
    patchProps(dom,oldProps,newProps);
}
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
    } else if($$typeof === ELEMENT) {
        dom = createNativeDOM(element);
    } else if($$typeof === FUNCTION_COMPONENT) {
        dom = createFunctionComponentDOM(element);
    } else if($$typeof === CLASS_COMPONENT) {
        dom = createClassComponentDOM(element);
    }
    element.dom = dom;//不管是什么类型的元素，都让他的dom属性指向它创建出来的真实ddom
    return dom;
}

function createClassComponentDOM(element) {
    let {type, props} = element;
    let componentInstance = new type(props);
    //当创建组件实例之后，把实例添加到虚拟节点上
    element.componentInstance = componentInstance;
    let renderElement = componentInstance.render();
    //在类组件实例上添加renderElement，指向上一次要渲染的虚拟dom节点
    //因为后面组件更新的，我们会重新render，然后跟上一次的renderElement进行dom diff
    componentInstance.renderElement = renderElement;
    let newDOM = createDOM(renderElement);
    renderElement.dom = newDOM;
    //最后生成这样的链式关系element.componentInstance.renderElement.dom=真实dom元素
    return newDOM;
}

//创建函数组件对应的真实的dom对象
function createFunctionComponentDOM(element) {
    let {type, props} = element;
    let renderElement = type(props);
    element.renderElement = renderElement;
    let newDOM = createDOM(renderElement);
    renderElement.dom = newDOM;
    return newDOM;
}

function createNativeDOM(element) {
    let {type, props} = element;
    let dom = document.createElement(type);
    //1.创建此虚拟dom节点的子节点
    createDOMChildren(dom, props.children);
    setProps(dom, props);
    //2.给此dom元素添加属性
    return dom;
}

function createDOMChildren(parentNode, children) {
    children && flatten(children).forEach((child, index) => {
        //child其实是虚拟dom，会在虚拟dom上加一个属性_mountIndex
        //指向此虚拟dom节点在父节点的索引，在后面做dom-diff时用到
        child._mountIndex = index;
        let childDOM = createDOM(child); //创建子虚拟dom节点的真实dom
        parentNode.appendChild(childDOM);
    });
}

export {
    ReactElement,
    createDOM
};
