import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        //console.log(parseCode('','')['code']);
        assert.equal(
            (parseCode('','')['code']),'');
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            (parseCode('let a;','')['code']), ''
        );
    });

    it('is parsing a simple while loop correctly', () => {
        assert.equal(
            parseCode('while (low >0) {i=i+1; }','')['code'],'while (low > 0) {}\n'
        );
    });

    it('is parsing a simple function correctly', () => {
        //console.log(parseCode('function foo (x) { x = x +1; return x;  }','1')['code']);
        assert.equal(parseCode('function foo () { c = x +1; return c;  }','')['code'], 'function foo() {\n  return x + 1;\n}\n'
        );
    });
    //////////////
    it('is parsing a simple function 2 correctly', () => {
        //console.log(parseCode('function foo (x) { x = x +1; return x;  }','1')['code']);
        assert.equal(
            parseCode('function foo (x) { let a = 1; x = a ; return x;  }','1')['code'], 'function foo(x) {\n  x = 1;\n  return 1;\n}\n'
        );
    });

    it('is parsing a simple function 3 correctly', () => {
        assert.equal(
            parseCode('function foo (x , y) { let a = y+2; x = a + 1 ; return x * y;  }','1,2')['code'], 'function foo(x, y) {\n  x = y + 2 + 1;\n  return (y + 2 + 1) * y;\n}\n'
        );
    });

    it('is parsing a simple function with if statement correctly', () => {
        assert.equal(
            parseCode('function foo (x , y) { let a = y+2; if(a>0) {x = a + 1 ; return x * y;}  }','1,2')['code'], 'function foo(x, y) {\n  if (y + 2 > 0) {\n    x = y + 2 + 1;\n    return (y + 2 + 1) * y;\n  }\n}\n'
        );
    });

    it('is parsing a simple function with while statement correctly', () => {
        assert.equal(
            parseCode('function foo (x , y) { let a = y+2; while(a>0) {x = a + 1 ; return x * y;}  }','1,2')['code'], 'function foo(x, y) {\n  while (y + 2 > 0) {\n    x = y + 2 + 1;\n    return (y + 2 + 1) * y;\n  }\n}\n'
        );
    });

    it('is parsing a simple function statement with while body correctly', () => {
        assert.equal(
            parseCode('let b = 4; \n function foo (x , y) { let a = y+2; while(x) {x = b * a ; return x * y;}  }',' true,"f",[1,2]')['code'], 'function foo(x, y) {\n  while (x) {\n    x = 4 * (y + 2);\n    return 4 * (y + 2) * y;\n  }\n}\n'
        );
    });


    it('is parsing a simple complexity code correctly', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n','1,2,3')['code'], 'function foo(x, y, z) {\n  if (x + 1 + y < z) {\n    return x + y + z + (0 + 5);\n  } else if (x + 1 + y < z * 2) {\n    return x + y + z + (0 + x + 5);\n  } else {\n    return x + y + z + (0 + z + 5);\n  }\n}\n'
        );
    });
});
