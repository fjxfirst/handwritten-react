import {isFunction} from './utils';
import {compareTwoElements} from './vdom';

export let updateQueue={
    updaters:[],
    isPending:false,//是否批量更新，true则处于批量更新模式
    add(updater){
        this.updaters.push(updater);
    },
    batchUpdate(){//强行全部更新
        let {updaters}=this;
        this.isPending=true;//进入批量更新模式
        let updater;
        while(updater=updaters.pop()){
            updater.updateComponent();
        }
        this.isPending=false;//改为非批量更新
    }
}
class Updater{
    constructor(componentInstance) {
        this.componentInstance= componentInstance;//一个Updater和一个类组件实例是1对1关系
        this.pendingStates=[];
        this.nextProps=null;
    }
    addState(partialState){
        this.pendingStates.push(partialState);//先把新状态放入数组中
        this.emitUpdate();
    }
    emitUpdate(nextProps){
        this.nextProps=nextProps;
        //如果传递了新的属性对象或者当前非批量更新模式的话就直接更新，否则先不更新
        if(nextProps||!updateQueue.isPending){
            this.updateComponent()
        }else{
            updateQueue.add(this);
        }
    }
    updateComponent(){
        let {componentInstance,pendingStates,nextProps}=this;
        if(nextProps||pendingStates.length>0){
            shouldUpdate(componentInstance,nextProps,this.getState())
        }
    }
    getState(){
        let {componentInstance,pendingStates}=this;
        let {state}=componentInstance;
        if(pendingStates.length>0){
            pendingStates.forEach(nextState =>{
                if(isFunction(nextState)){
                    state=nextState.call(componentInstance,state);
                }else {
                    state={...state,...nextState}
                }
            })
        }
        pendingStates.length=0;
        return state;
    }
}
function shouldUpdate(componentInstance,nextProps,nextSate) {
    componentInstance.props=nextProps;
    componentInstance.state=nextSate;
    if(componentInstance.shouldComponentUpdate
    &&componentInstance.shouldComponentUpdate(nextProps,nextSate)){
        return false;
    }
    componentInstance.forceUpdate()
}
class Component{
    constructor(props) {
        this.props=props;
        this.state={};
        this.$updater=new Updater(this);
        this.nextProps=null;//下一个属性对象
    }
    //批量更新,partialState是部分状态，因为要被合并
    setState(partialState){
        this.$updater.addState(partialState)
    }
    forceUpdate(){
        let {props,state,renderElement:oldRenderElement}=this;
        if(this.componentWillMount){
            this.componentWillMount();//组件将要更新
        }
        let newRenderElement=this.render();
        let currentElement=compareTwoElements(oldRenderElement,newRenderElement);
        this.renderElement=currentElement;
        if(this.componentDidMount){
            this.componentDidMount();//组件更新完成
        }
    }
}
//类组件和函数组件编译之后都是函数，通过此属性来区分
Component.prototype.isReactComponent={};
export {
    Component
}
