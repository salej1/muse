require('./muse');
var fs = require('fs');

var template = fs.readFileSync('./test_template.html', 'utf8')
var m = new Muse(template);

var myObjects = [
    {name:'One', value:1},
    {name:'Two', value:2},
    {name:'Trhee', value:3},
    {name:'Four', value:4},
    {name:'Five', value:5}
];

m.addAttribute("title", 'Hello Everyone');
m.addAttribute("items", myObjects);

console.log(m.render());




