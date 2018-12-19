const esprima = require('esprima');
const estraverse = require('estraverse');
const astring  = require('astring');

function generateHtml(parsedCode,pool) {
    var myhtml = '';
    let co={red:[],green:[]}; // color arrays
    esprima.parseScript(parsedCode,{loc:true},function(node){
        if(node.type=='IfStatement' || node.type=='WhileStatement')
            getColorLines(node,co,pool); // get the lines with red / green color

    });
    var lines = parsedCode.split('\n'); // split the string output to lines
    for(var i=1;i<lines.length+1;i++){ // set the html code
        if(co.green.includes(i))
            myhtml += '<span style="background-color: greenyellow">' + lines[i-1] + '</span>' + '<br>';
        else if(co.red.includes(i))
            myhtml += '<span style="background-color: red">' + lines[i-1] + '</span>' + '<br>';
        else myhtml += lines[i-1] + '<br>' ;
    }
    return myhtml;
}

function parseCode(codeToParse,stringFunctionArgs) {
    var pool=[] , scopePool = [], funcArgsArray= [] ,funcPool=[];
    var parsedCode = esprima.parseScript(codeToParse, {loc:true ,range:true},function(node){
        node.string=getStatement(node.range[0],node.range[1],codeToParse);
        if (node.type == 'VariableDeclarator') VariableDeclarator(node,pool);
        else if(node.type == 'FunctionDeclaration') subFunctionDeclaration(node,stringFunctionArgs,funcArgsArray,funcPool);});
    let subtree = estraverse.replace(parsedCode ,{
        enter(node) {
            if( node.type == 'VariableDeclaration') {VariableDeclarator(node.declarations[0],scopePool); return this.remove();}
            else if (node.type == 'ReturnStatement') return subReturnStatement(node,pool,scopePool);
            else if(node.type =='IfStatement') return subIfStatement(node,pool);
            else if(node.type =='WhileStatement') return subIfStatement(node,pool);
        },
        leave(node) {
            if (node.type == 'BlockStatement') scopePool = [];
            else if (node.type=='AssignmentExpression') AssignmentExpression(node,pool,scopePool);
            else if (node.type == 'ExpressionStatement') {var ans = ExpressionStatement(node,pool,scopePool,funcArgsArray) ; if(ans==null) this.remove(); else ans;}}});
    var rcode = astring.generate(subtree), rpool =pool.concat(funcPool), rhtml =generateHtml(rcode,rpool);
    return {code:rcode,pool:rpool , html:rhtml};
}

const substitute=(node,pool)=>{
    let a =estraverse.replace(node,{
        leave(node){
            if(node.type =='Identifier') {
                var ans =Identifier(node, pool);
                return ans;
            }
        }
    });
    node=a;
    return node;
};

const inPool = (str,pool)=>{
    var ans = -1;
    var i=0;
    pool.forEach(x=> {
        if(x['left']==str)
            ans= i ;
        else i++;});
    return ans;
};
const getColorLines = (node,arr,pool) =>{
    var line = node.test.loc.end.line;
    node.test=substitute(node.test,pool);
    var test = astring.generate(node.test);

    try {
        var value = eval(test);
        value == true ? arr['green'].push(line) : arr['red'].push(line);
    } catch (err) {
        err;
    }
};

const extendPool=(pool,e)=> {

    if(pool.length==0) {
        pool.push(e);
    }
    else {
        var oldvarIndex = inPool(e['left'],pool);
        if(oldvarIndex >=0){
            pool.splice(oldvarIndex);
        }
        pool.push(makeEquation(e['left'],e['right']));
    }
};

const makeEquation = (l, r) => ({left: l, right: r});

const getStatement=(start,end,source)=>{
    return source.slice( start, end);
};

const subIfStatement = (node,pool) =>{
    substitute(node.test,pool);
    return node;
};

const subFunctionDeclaration = (node,stringFunctionArgs,argsNamesArray,funcPool) => {
    var nodes = esprima.parseScript(stringFunctionArgs,{tolerant: true});
    var args = node.params; // args node
    var exp = [];
    args.forEach(x=>argsNamesArray.push(x.name)); // array of args names
    if(nodes.body.length > 0 ) exp = nodes.body[0].expression; else return;
    var funcArgsvalues= exp.expressions !=undefined ? exp.expressions.map((x)=> astring.generate(x)) : [astring.generate(exp)] ; // args values
    var i=0;
    args.forEach(x => extendPool(funcPool,makeEquation(x.name,funcArgsvalues[i++])));
};

const ExpressionStatement = (node,pool,scopePool,functionArgs) =>{ // pattern: c = c + 5
    var left =node.expression.left.name;
    var right = astring.generate(node.expression.right);
    extendPool(scopePool,makeEquation(left,right));
    if(!functionArgs.includes(left))
        return estraverse.replace(node,{enter(){this.remove();}});
    else return esprima.parseScript(left + ' = ' + right).body[0]; // for debug
};


const Identifier = (node , pool) =>{
    var index = inPool(node.name,pool);
    var newnode=node;
    if(index>=0){
        newnode=esprima.parseScript(pool[index]['right']).body[0];
        return newnode.expression;
    }
    else return node;

};

const AssignmentExpression = (node , pool,scopePool) =>{
    node.right=substitute(node.right,scopePool);
    node.right=substitute(node.right,pool);
    return node;
};

const VariableDeclarator = (node,pool) => {
    if (node.init != null) {
        substitute(node.init,pool);
    }
    var init = node.init==null? null:astring.generate(node.init);
    extendPool(pool,makeEquation(node.id.name,init)); // add every var dec to global pool
};

const subReturnStatement = (node,pool,scopePool) =>{
    substitute(node,scopePool); // sub test args with scope pool
    substitute(node,pool);   // sub test args with global pool
    return node ;
};


export {parseCode , generateHtml};

// let code = 'function foo(x, y,z) {\n' +
//     'while (x) {\n' +
//     '    x = 4 * (y + 2);\n' +
//     '   return 4 * (y + 2) * y;\n' +
//     '  }\n' +
//     '}';
// //let parse = parseCode('function foo (x) { let a = b; x = a;return x;  }','1 , 2');
// let parse = parseCode(code, 'true,"f",[1,2]');
// //console.log(esprima.parseScript(parse['code']));
// //console.log(parse['code']);
// console.log(generateHtml(parse['code'],parse['pool']));
