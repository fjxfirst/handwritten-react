import {ELEMENT_TEXT, TAG_HOST, TAG_ROOT, TAG_TEXT, PLACEMENT, DELETION, UPDATE, TAG_CLASS, TAG_FUNCTION_COMPONENT} from "./constants";
import {setProps} from "./utils";
import {UpdateQueue, Update} from "./UpdateQueue";

/**
 * 从根节点开始渲染和调度 两个阶段
 * diff阶段 对比新旧的虚拟dom，进行增量更新或创建。render阶段
 * 这个阶段比较花时间，需要我们对任务进行拆分，拆分的维度是虚拟dom，此阶段可以暂停
 * render阶段的成果是effect list 知道哪些节点更新哪些节点删除了，哪些节点增加了
 * render阶段有2个任务，1.根据虚拟dom生成fiber树  2.收集effectlist
 * commit阶段，进行dom更新创建阶段，此阶段不能暂停，要一气呵成
 */
let nextUnitOfWork = null; //下一个工作单元
let workInProgressRoot = null; //RootFiber 应用的根,正在渲染的
let currentRoot = null; // 渲染成功之后的当前根ROOT
let deletions = []; //删除的节点并不放在effectlist,所以需要单独记录
let workInProgressFiber = null; //正在工作中的fiber
let hookIndex=0;
export function scheduleRoot(rootFiber) { // {tag:TAG_ROOT,stateNode:container, props:{children:[element]}}
    if (currentRoot && currentRoot.alternate) {//第二次之后的更新
        workInProgressRoot = currentRoot.alternate;//双缓冲机制
        // workInProgressRoot.props = rootFiber.props;
        workInProgressRoot.alternate = currentRoot;
        if(rootFiber){
            workInProgressRoot.props = rootFiber.props;
        }
    } else if (currentRoot) {//说明至少渲染了一次, 第一次更新
        if(rootFiber){
            rootFiber.alternate = currentRoot;
            workInProgressRoot = rootFiber;
        }else{
            workInProgressRoot={
                ...currentRoot,
                alternate:currentRoot
            }
        }

    } else {//如果是第一次渲染
        workInProgressRoot = rootFiber;
    }
    workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null;
    nextUnitOfWork = workInProgressRoot;
}

function performUnitOfWork(currentFiber) {
    beginWork(currentFiber);
    if (currentFiber.child) {
        return currentFiber.child;
    }

    while (currentFiber) {
        completeUnitOfWork(currentFiber);
        if (currentFiber.sibling) {
            return currentFiber.sibling;
        }
        currentFiber = currentFiber.return;
    }
}

//在完成的时候要收集有副作用的fiber，然后组成effect list
//每个fiber有2个属性，firstEffect指向第一个有副作用的子fiber，lastEffect指向最后一个有副作用的子Fiber
//中间的用nextEffect做成一个单链表，firstEffect=大儿子，nextEffect=二儿子...,lastEffect=小儿子
function completeUnitOfWork(currentFiber) {
    let returnFiber = currentFiber.return;
    if (returnFiber) {
        //这一段是吧自己儿子的effect链挂到父亲上
        if (!returnFiber.firstEffect) {
            returnFiber.firstEffect = currentFiber.firstEffect;
        }
        if (currentFiber.lastEffect) {
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
            }
            returnFiber.lastEffect = currentFiber.lastEffect;
        }
        //这段是把自己挂到父亲上
        const effectTag = currentFiber.effectTag;
        if (effectTag) {
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber;
            } else {
                returnFiber.firstEffect = currentFiber;
            }
            returnFiber.lastEffect = currentFiber;
        }
    }
}

/**
 * 1.创建真实dom元素
 */
function beginWork(currentFiber) {
    if (currentFiber.tag === TAG_ROOT) {//根
        updateHostRoot(currentFiber);
    } else if (currentFiber.tag === TAG_TEXT) {//文本
        updateHostText(currentFiber);
    } else if (currentFiber.tag === TAG_HOST) { //原生dom节点
        updateHost(currentFiber);
    }else if(currentFiber.tag === TAG_CLASS){
        updateClassComponent(currentFiber);
    }else if(currentFiber.tag === TAG_FUNCTION_COMPONENT){
        updateFunctionComponent(currentFiber);
    }
}
function updateFunctionComponent(currentFiber) {
    workInProgressFiber=currentFiber;
    hookIndex=0;
    workInProgressFiber.hooks=[];
    const newChildren = [currentFiber.type(currentFiber.props)];
    reconcileChildren(currentFiber,newChildren);
}
function updateClassComponent(currentFiber) {
    if(!currentFiber.stateNode){//类组件stateNode 组件的实例
        //创建实例，类组件实例 fiber双向指向
        currentFiber.stateNode = new currentFiber.type(currentFiber.props);
        currentFiber.stateNode.internalFiber=currentFiber;
        currentFiber.updateQueue=new UpdateQueue();
    }
    //给组件的实例的state赋值
    currentFiber.stateNode.state=currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state);
    let newElement=currentFiber.stateNode.render();
    const newChildren=[newElement];
    reconcileChildren(currentFiber,newChildren);
}
function updateHost(currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber)
    }
    const newChildren = currentFiber.props.children;
    reconcileChildren(currentFiber, newChildren);
}

function createDOM(currentFiber) {
    if (currentFiber.tag === TAG_TEXT) {
        return document.createTextNode(currentFiber.props.text);
    } else if (currentFiber.tag === TAG_HOST) {
        let stateNode = document.createElement(currentFiber.type);
        updateDOM(stateNode, {}, currentFiber.props);
        return stateNode;
    }
}

function updateDOM(stateNode, oldProps, newProps) {
    if(stateNode && stateNode.setAttribute)
    setProps(stateNode, oldProps, newProps)
}

function updateHostText(currentFiber) {
    if (!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber)
    }
}

function updateHostRoot(currentFiber) {
    // 1.先处理自己，如果是一个原生节点，创建真实dom，但在这里无所谓了，本来就是<div id="root"></div>
    // 2.创建子fiber
    let newChildren = currentFiber.props.children; //[element]
    reconcileChildren(currentFiber, newChildren);
}

function reconcileChildren(currentFiber, newChildren) {
    let newChildIndex = 0; //新子节点的的索引
    let prevSibling; // 上一个新的子fiber
    let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
    if(oldFiber){
        oldFiber.firstEffect=oldFiber.lastEffect=oldFiber.nextEffect=null;
    }
    while (newChildIndex < newChildren.length || oldFiber) {
        let newChild = newChildren[newChildIndex];
        let newFiber;
        // 如果type一样，说明可以服用旧的fiber
        const sameType = newChild && oldFiber && newChild.type === oldFiber.type;
        let tag;
        if(newChild&&typeof newChild.type==='function'&&newChild.type.prototype.isReactComponent){
            tag=TAG_CLASS;
        }
        else if (newChild && typeof newChild.type === 'function') {
            tag = TAG_FUNCTION_COMPONENT; //这是函数组件
        } else if (newChild && newChild.type === ELEMENT_TEXT) {
            tag = TAG_TEXT; //这是一个文本节点
        } else if (newChild && typeof newChild.type === 'string') {
            tag = TAG_HOST;//如果type是字符串，那么这是一个原生dom节点
        }
        if (sameType) { //如果一样
            if (oldFiber.alternate) {//说明至少已经更新一次了
                newFiber = oldFiber.alternate;//如果有上上次的fiber，就拿过来作为这一次的fiber
                newFiber.props = newChild.props;
                newFiber.alternate = oldFiber;
                newFiber.effectTag = UPDATE;
                newFiber.updateQueue=oldFiber.updateQueue||new UpdateQueue();
                newFiber.nextEffect = null;
            } else {
                newFiber = {
                    tag: oldFiber.tag,
                    type: oldFiber.type,
                    props: newChild.props, //这里需要新的props
                    stateNode: oldFiber.stateNode,
                    return: currentFiber,
                    updateQueue:oldFiber.updateQueue||new UpdateQueue(),
                    alternate: oldFiber, //指向旧的fiber
                    effectTag: UPDATE,// 副作用标识，render我们会收集副作用，增加、删除、更新
                    nextEffect: null
                }
            }
        } else {
            if (newChild) {
                newFiber = {
                    tag,
                    type: newChild.type,
                    props: newChild.props,
                    stateNode: null,
                    return: currentFiber,
                    updateQueue:new UpdateQueue(),
                    effectTag: PLACEMENT,// 副作用标识，render我们会收集副作用，增加、删除、更新
                    nextEffect: null, //effectlist也是一个单链表，和完成的顺序是一样的
                };
            }
            if (oldFiber) {//如果新旧fiber不一样，那就要删除旧的节点
                oldFiber.effectTag = DELETION;
                deletions.push(oldFiber);
            }
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling; //oldFiber指针向后移动一次
        }
        if (newFiber) {
            if (newChildIndex === 0) { //如果当前索引为0，说明是第一个儿子
                currentFiber.child = newFiber;
            } else {
                prevSibling.sibling = newFiber; //指向下一个兄弟
            }
            prevSibling = newFiber;
        }
        newChildIndex++;
    }
}

//循环执行工作
function workLoop(deadline) {
    let shouldYield = false; // 是否让出时间片或者控制权
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1; //没有时间了，就要让出控制权
    }
    if (!nextUnitOfWork && workInProgressRoot) { //如果时间片到期了还有任务没有完成，就需要请求浏览器再次调度
        console.log('render阶段结束');
        //完成之后提交
        commitRoot();
    }
    // 每一帧都要执行
    window.requestIdleCallback(workLoop, {timeout: 500});
}

function commitRoot() {
    deletions.forEach(commitWork);//执行effectlist之前先把该删除的元素删除掉
    let currentFiber = workInProgressRoot.firstEffect;
    while (currentFiber) {
        commitWork(currentFiber);
        currentFiber = currentFiber.nextEffect;
    }
    deletions.length = 0;//提交之后清空
    currentRoot = workInProgressRoot; // 当前渲染成功之后的根fiber赋值
    workInProgressRoot = null;
}

function commitWork(currentFiber) {
    if (!currentFiber) {
        return;
    }
    let returnFiber = currentFiber.return;
    while (returnFiber.tag!==TAG_HOST
        &&returnFiber.tag!==TAG_ROOT
        &&returnFiber.tag!==TAG_TEXT){
        returnFiber=returnFiber.return;
    }
    let domReturn = returnFiber.stateNode;
    if (currentFiber.effectTag === PLACEMENT) {//新增加节点
        let nextFiber = currentFiber;
        if(nextFiber.tag===TAG_CLASS){
            return;
        }
        while (nextFiber.tag!==TAG_HOST&&nextFiber.tag!==TAG_TEXT){
            nextFiber=currentFiber.child;
        }
        domReturn.appendChild(nextFiber.stateNode);
    } else if (currentFiber.effectTag === DELETION) {//删除节点
        return commitDeletion(currentFiber,domReturn);
        // domReturn.removeChild(currentFiber.stateNode) 这个就没用了，因为要考虑类组件的情况
    } else if (currentFiber.effectTag === UPDATE) {
        if (currentFiber.type === ELEMENT_TEXT) {
            if (currentFiber.alternate.props.text !== currentFiber.props.text) {
                currentFiber.stateNode.textContent = currentFiber.props.text;
            }
        } else {
            updateDOM(currentFiber.stateNode, currentFiber.alternate.props, currentFiber.props);
        }
    }
    currentFiber.effectTag = null;
}
function commitDeletion(currentFiber,domReturn){
    if (currentFiber.tag===TAG_HOST||currentFiber.tag===TAG_TEXT){
        domReturn.removeChild(currentFiber.stateNode);
    }else{
        commitDeletion(currentFiber.child,domReturn);
    }
}

/**
 *当执行hooks的时候，在执行之前已经在updateFunctionComponent中执行了
 *  workInProgressFiber=currentFiber;
 *  hookIndex=0;
 *  workInProgressFiber.hooks=[];
 *
 */
export function useReducer(reducer, initialValue){
    let newHook = workInProgressFiber.alternate // 第二次渲染的时候拿到上一次的hook
        && workInProgressFiber.alternate.hooks
    && workInProgressFiber.alternate.hooks[hookIndex];
    if(newHook){ //说明是第二次渲染
        newHook.state=newHook.updateQueue.forceUpdate(newHook.state);
    }else{
        newHook={
            state:initialValue,
            updateQueue:new UpdateQueue()
        }
    }
    const dispatch=action=>{
        let payload = reducer?reducer(newHook.state,action):action
        newHook.updateQueue.enqueueUpdate(
            new Update(payload)
        );
        scheduleRoot();
    };
    workInProgressFiber.hooks[hookIndex++]=newHook;
    return [newHook.state, dispatch];
}
export function useState(initalValue){
    return useReducer(null,initalValue);
}
//告诉浏览器，我现在有任务，请你再闲的时候执行
//有一个优先级的概念。expirationTime
window.requestIdleCallback(workLoop, {timeout: 500});
