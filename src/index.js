import React from './react';
import ReactDOM from './react-dom';
function FunctionCounter(props) {
    return (
        <div id={'counter'+props.number}>
            <p key='hello'>{props.number}</p>
            <button onClick={props.add}>+</button>
        </div>
    )
}
class Counter extends React.Component{
    constructor(props) {
        super(props);
        this.state={number:0};
    }
    add=()=>{
        this.setState({number:this.state.number+1})
    }
    render() {
        return <FunctionCounter number={this.state.number} add={this.add}/>
    }
}
ReactDOM.render(
    <Counter/>,
    document.getElementById('root')
);














