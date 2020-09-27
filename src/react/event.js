import {updateQueue} from './component';

/**
 * 在React中我们并不是把事件绑在要绑定的dom节点上，而是绑到document上，类型事件委托
 * 1.因为合成事件可以屏蔽浏览器的差异，不同浏览器绑定事件和触发事件的方法不一样
 * 2.合成可以实现事件对象复用，重用，减少垃圾回收，提高性能
 * 3.因为默认要实现批量更新，setState 两个setState合成并成一次更新，这个也是在合成事件中
 * @param dom 要绑定事件的domjied
 * @param eventType 事件的类型onClick onChange
 * @param listener 事件处理函数
 */
export function addEvent(dom,eventType,listener) {
    eventType=eventType.toLowerCase();
    let eventStore=dom.eventStore||(dom.eventStore={})
    eventStore[eventType]=listener;
    document.addEventListener(eventType.slice(2),dispatchEvent,false)
}
let syntheticEvent;
function dispatchEvent(event) {//event是原生事件对象，但是传递给我们的监听函数并不是他
    let {type,target}=event;
    let eventType='on'+type;
    syntheticEvent=getSyntheticEvent(event);
    updateQueue.isPending=true;
    //模拟事件冒泡
    while(target){
        let {eventStore}=target;
        let listener=eventStore&& eventStore[eventType];
        if(listener){
            listener.call(target,syntheticEvent)
        }
        target=target.parentNode;
    }
    for(let key in syntheticEvent){
        if(key!=='persist'){
            syntheticEvent[key]=null;
        }
    }
    //当事件处理函数执行完成后，把批量更新模式改为false
    updateQueue.isPending=false;
    updateQueue.batchUpdate();
}
function persist() {
    syntheticEvent={persist}
}
function getSyntheticEvent(nativeEvent) {
    if(!syntheticEvent){
        syntheticEvent={persist};
    }
    syntheticEvent.nativeEvent =nativeEvent;
    syntheticEvent.currentTarget=nativeEvent;
    for(let key in nativeEvent){
        if(typeof nativeEvent[key]==='function'){
            syntheticEvent[key]=nativeEvent[key].bind(nativeEvent)
        }else{
            syntheticEvent[key]=nativeEvent[key]
        }
    }
    return syntheticEvent
}
