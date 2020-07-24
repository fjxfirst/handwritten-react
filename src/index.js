import React from './react';
import ReactDOM from './react-dom';


//首次渲染与节点更新
/*let style = {border: '3px solid red', margin: '5px'};
let element1 = (
    <div id='A1' style={style}>
        A1
        <div id="B1" style={style}>
            B1
            <div id="C1" style={style}>C1</div>
            <div id="C2" style={style}>C2</div>
        </div>
        <div id="B2">B2</div>
    </div>
);
ReactDOM.render(element1, document.getElementById('root'));
let render2=document.getElementById('render2');
render2.addEventListener('click',()=>{
    let element2=(
        <div id='A1-new' style={style}>
            A1-new
            <div id="B1-wen" style={style}>
                B1-new
                <div id="C1-new" style={style}>C1-new</div>
                <div id="C2-new" style={style}>C2-new</div>
            </div>
            <div id="B2-new">B2-new</div>
            <div id="B3">B3</div>
        </div>
    );
    ReactDOM.render(element2, document.getElementById('root'));
});

let render3=document.getElementById('render3');
render3.addEventListener('click',()=>{
    let element3=(
        <div id='A1-new2' style={style}>
            A1-new2
            <div id="B1-wen2" style={style}>
                B1-new2
                <div id="C1-new2" style={style}>C1-new2</div>
                <div id="C2-new2" style={style}>C2-new2</div>
            </div>
            <div id="B2">B2-new2</div>
        </div>
    );
    ReactDOM.render(element3, document.getElementById('root'));
});*/

//手写实现类组件
class ClassCounter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {number: 0};
    }

    onClick = () => {
        this.setState(state => ({number: state.number + 1}));
    };

    render() {
        return (
            <div id="counter">
                <span>{this.state.number}</span>
                <button onClick={this.onClick}>加1</button>
            </div>
        )
    }
}
ReactDOM.render(<ClassCounter name="计数器"/>,document.getElementById('root'));
