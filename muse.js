require('neon');

var MuseHelper = {
    createBlock: function createBlock(blockTag) {
        var tokens = blockTag.split(' ');
        var tag = tokens[0];
        var variable = tokens[1];
        var tail = tokens[3];
        var arrayExpression = tail.match(/\${\w+}/g)[0];
        var arrayName = arrayExpression.substring(2, arrayExpression.length -1);

        return {
            block: blockTag,
            variable: variable,
            arrayName: arrayName,
            arrayExpression: arrayExpression,
            content: []
        };
    },

    scanBlocks: function scanBlocks(input) {
        var lines = input.split('\n');
        var content = [];
        var blockStart = /<mu:foreach \w+ in \${\w+}\s*>/g;
        var blockEnd = /<\/mu:foreach>/g;

        var s1 = function(lines, i) {
            var block;

            if(i === lines.length) {
                return;
            }

            if(lines[i].match(blockStart)) {
                block = MuseHelper.createBlock(lines[i]);
                content.push(block);
                s3(lines, i + 1, block);
            }
            else {
                s2(lines, i);
            }
        };

        var s2 = function(lines, i) {
            content.push(lines[i]);
            s1(lines, i + 1);
        };

        var s3 = function(lines, i, block) {
            if(lines[i].match(blockEnd)) {
                s1(lines, i + 1);
            }
            else{
                block.content.push(lines[i]);
                s3(lines, i + 1, block);
            }
        };

        s1(lines, 0);

        return content;
    },

    evaluate: function evaluate(attributes, expression) {
        var expressionValue = /\${([^}]+)\}/g;
        var token = expression.match(expressionValue)[0];
        var variable = token.substring(2, token.length -1);
        var toEval = 'attributes.' + variable;
        var expressionResult = eval(toEval);

        return expressionResult;
    },

    expandBlock: function expandBlock(block, attributes, output) {
        var array = MuseHelper.evaluate(attributes, block.arrayExpression);

        var expandBlockLine = function(blockLine) {
            blockLine = blockLine.replace(
                block.variable, block.arrayName + '[' + i + ']');

            output.push(blockLine);
        };

        for(var i = 0; i < array.length; i ++) {
            block.content.forEach(expandBlockLine);
        }
    },

    expandBlocks: function expandBlocks(input, attributes) {
        var expanded = [];
        var block;
        var array;

        input.forEach(function(line) {
            if(line.hasOwnProperty('block')) {
                MuseHelper.expandBlock(line, attributes, expanded);
            }
            else {
                expanded.push(line);
            }
        });

        return expanded;
    },

    evaluateExpressions: function evaluateExpressions(input, attributes) {
        var output = [];
        var expression = /<mu:val \${([^}]+)\}\s*\/>/g;

        var s1 = function(input, i) {
            var expressionsInLine;

            if(i === input.length) {
                return;
            }

            expressionsInLine = input[i].match(expression);
            if(expressionsInLine) {
                s3(input, i, expressionsInLine);
            }
            else {
                s2(input, i);
            }
        };

        var s2 = function(input, i) {
            output.push(input[i]);
            s1(input, i + 1);
        };

        var s3 = function(input, i, expressions) {
            var lineBuffer = [];

            expressions.forEach(function(expression) {
                var expressionResult = MuseHelper.evaluate(attributes, expression);

                input[i] = input[i].replace(expression, expressionResult);
            });

            output.push(input[i]);

            s1(input, i + 1);
        };

        s1(input, 0);

        return output;
    }
};

Class('Muse')({
    prototype: {
        init: function init(template) {
            this.content = [];
            this.attributes = [];
            this.template = template;
        },
        addAttribute: function addAttribute(name, object){
            this.attributes[name] = object;
        },
        render: function render(){
           var input = this.template;
           var content = MuseHelper.scanBlocks(input);
           var expressions = MuseHelper.expandBlocks(content, this.attributes);
           var result = MuseHelper.evaluateExpressions(expressions, this.attributes);

           return result.join('\n');
        }
    }
});
