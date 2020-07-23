import {ELEMENT_TEXT, TAG_HOST, TAG_ROOT, TAG_TEXT, PLACEMENT} from "./constants";
import {setProps} from "./utils";

/**
 * 从根节点开始渲染和调度 两个阶段
 * diff阶段 对比新旧的虚拟dom，进行增量更新或创建。render阶段
 * 这个阶段比较花时间，需要我们对任务进行拆分，拆分的维度是虚拟dom，此阶段可以暂停
 * render阶段的成果是effect list 知道哪些节点更新哪些节点删除了，哪些节点增加了
 * render阶段有2个任务，1.根据虚拟dom生成fiber树  2.收集effectlist
 * commit阶段，进行dom更新创建阶段，此阶段不能暂停，要一气呵成
 */
let nextUnitOfWork = null; //下一个工作单元
let workInProgressRoot = null; //RootFiber 应用的根
export function scheduleRoot(rootFiber) { // {tag:TAG_ROOT,stateNode:container, props:{children:[element]}}
    workInProgressRoot = rootFiber;
    nextUnitOfWork = rootFiber;
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
    if (currentFiber.tag === TAG_ROOT) {
        updateHostRoot(currentFiber);
    } else if (currentFiber.tag === TAG_TEXT) {
        updateHostText(currentFiber);
    } else if (currentFiber.tag === TAG_HOST) { //原生dom节点
        updateHost(currentFiber);
    }
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
    while (newChildIndex < newChildren.length) {
        let newChild = newChildren[newChildIndex];
        let tag;
        if (newChild.type === ELEMENT_TEXT) {
            tag = TAG_TEXT; //这是一个文本节点
        } else if (typeof newChild.type === 'string') {
            tag = TAG_HOST;//如果type是字符串，那么这是一个原生dom节点
        }
        let newFiber = {
            tag,
            type: newChild.type,
            props: newChild.props,
            stateNode: null,
            return: currentFiber,
            effectTag: PLACEMENT,// 副作用标识，render我们会收集副作用，增加、删除、更新
            nextEffect: null, //effectlist也是一个单链表，和完成的顺序是一样的
        };
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
    let currentFiber = workInProgressRoot.firstEffect;
    while (currentFiber) {
        commitWork(currentFiber);
        currentFiber = currentFiber.nextEffect;
    }
    workInProgressRoot = null;
}

function commitWork(currentFiber) {
    if (!currentFiber) {
        return;
    }
    let returnFiber = currentFiber.return;
    let returnDOM = returnFiber.stateNode;
    if (currentFiber.effectTag === PLACEMENT) {
        returnDOM.appendChild(currentFiber.stateNode);
    }
    currentFiber.effectTag = null;
}

//告诉浏览器，我现在有任务，请你再闲的时候执行
//有一个优先级的概念。expirationTime
window.requestIdleCallback(workLoop, {timeout: 500});
