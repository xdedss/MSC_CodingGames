


with open('./sk.merge.js', 'w', encoding='utf-8') as f:
    
    f.write('define(function(){')
    f.write('\n')
    f.write('return function(){')
    f.write('\n\n')
    f.write('var Sk;')
    f.write('\n\n')
    with open('./skulpt.js', 'r', encoding='utf-8') as fin:
        f.write(fin.read().replace('var Sk', 'Sk').replace('typeof global !== "undefined" ? global', 'true ? {}').replace('__JSBI;', '__JSBI;window.JSBI = JSBI;'))
    f.write('\n\n')
    with open('./skulpt-stdlib.js', 'r', encoding='utf-8') as fin:
        f.write(fin.read())
    f.write('\n\n')
    
    f.write('Sk.global.eval = window.eval')
    f.write('\n\n')
    f.write('window.JSBI = Sk.global.JSBI')
    f.write('\n\n')
    f.write('return Sk;\n}')
    f.write('\n')
    f.write('});')
