import React from './react';
import ReactDOM from './react-dom';
class Counter extends React.Component{
    constructor(props) {
        super(props);
        this.state={number:0};
    }
    add=()=>{
        this.setState({number:this.state.number+1})
    }
    render() {
        return <div id={'counter'+this.state.number} onClick={this.add}>+</div>
    }
}
ReactDOM.render(
    <Counter/>,
    document.getElementById('root')
);














