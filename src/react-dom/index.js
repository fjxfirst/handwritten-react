import {createDOM} from '../react/vdom'
function render(element,container) {
    //1.把虚拟dom变成真实dom
    let dom=createDOM(element);
    //2.把真实dom挂载到container上
    container.insertBefore(dom,container.sibling);
}
export default {
    render
}
