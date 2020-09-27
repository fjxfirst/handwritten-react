class Component{
    constructor(props) {
        this.props=props;
    }
}
//类组件和函数组件编译之后都是函数，通过此属性来区分
Component.prototype.isReactComponent={};
export {
    Component
}
