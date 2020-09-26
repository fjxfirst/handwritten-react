import {ELEMENT_TEXT} from "./constants";
import {Update, UpdateQueue} from './UpdateQueue'
import {scheduleRoot,useReducer, useState} from "./scheduler";
function createElement(type, config, ...children) {
    delete config.__self;
    delete config.__source; //表示这个元素实在哪行哪列哪个文件生成的
    //返回虚拟dom
    return {
        type,
        props: {
            ...config, //做了兼容处理，如果是React元素的话返回自己，如果是文本类型，如果是一个字符串的话，返回元素对象
            children: children.map(child => {
                return typeof child === 'object' ? child : {
                    type: ELEMENT_TEXT,
                    props: {text: child, children: []}
                }
            })
        }
    }
}
class Component{
    constructor(props) {
        this.props=props;
        this.updateQueue=new UpdateQueue();
    }
    setState(payload){
        let update=new Update(payload);
        //updateQueue其实是放在此类组件对应的fiber节点的internalFiber上
        this.internalFiber.updateQueue.enqueueUpdate(update);
        // this.updateQueue.enqueueUpdate(update);
        scheduleRoot();//从根节点开始调度
    }
}
Component.prototype.isReactComponent={};//类组件
const React = {
    createElement,
    Component,
    useReducer,
    useState
};
export default React;
