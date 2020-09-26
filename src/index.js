import React from './react';
import ReactDOM from './react-dom';

let onClick = () => {
    alert('hello');
};
let element=<button id='sayHello' onClick={onClick}>
    say<span style={{color:'red'}}>hello</span>
</button>
/*let element=React.createElement(
    'button', {id:'sayHello',onClick},
    'say',React.createElement('span',{color:'red'},'hello'));*/
console.log(element);
ReactDOM.render(
    element,
    document.getElementById('root')
);
