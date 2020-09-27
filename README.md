This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 手写fiber架构源码

fiber相关源码在src-fiber-source目录下

## 手写react源码

src-fiber-source和src目录有重复实现功能，演示运行时请修改对应的目录为src

## 组件更新

在React中进行事件处理函数指向的时候，会先进入批量更新模式，在执行此函数的时候，可能会引起多个组件的更新，
但是因为当前是出于批量更新模式的，所以不会立即更新state,而是会先把这个状态缓存起来，在事件函数执行完成之后在全部更新这个脏组件
```
handleClick = () => {
    this.setState({number:this.state.number + 1});
    console.log(this.state.number);
    this.setState({number:this.state.number + 1});
    console.log(this.state.number);
}
```
