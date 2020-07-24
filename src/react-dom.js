import {TAG_ROOT} from './constants'
import {scheduleRoot} from "./scheduler";

//把一个元素渲染到一个容器内部
function render(element, container) { //container=root DOM节点
    let rootFiber = {
        tag: TAG_ROOT,//每个fiber会有一个tag标识此元素的类型
        stateNode: container, // 一般情况下如果这个元素是一个原生节点的话，stateNode指向真实DOM元素
        //props.children是一个数组，里面放的是React元素，虚拟dom，后面会根据每个React元素创建对应的Fiber
        props: {children: [element]}
    };
    scheduleRoot(rootFiber);
}

const ReactDOM = {
    render
};
export default ReactDOM;
/**
 * reconciler
 * schedule
 */
