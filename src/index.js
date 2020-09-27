import React from './react';
import ReactDOM from './react-dom';
class ClassComponent extends React.Component{
    constructor(props) {
        super(props);
        
    }
    
    render() {
        return React.createElement('div',{id:'counter'},'hello');
    }
}
function FunctionCounter(){
    return React.createElement('div',{id:'counter'},'hello');
}
let element1= React.createElement('div',{id:'counter'},'hello');
let element2=React.createElement(ClassComponent,{id:'counter'});
let element3=React.createElement(FunctionCounter);
ReactDOM.render(
    element2,
    document.getElementById('root')
);














