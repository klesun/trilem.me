const GenerateBoard = require('../src/GenerateBoard.js');
const TestCase = require('klesun-node-tools/src/Transpiled/Lib/TestCase.js');

const provide__generateBoardShape = () => {
    const testCases = [];

    testCases.push({
        title: 'very basic example rectangular board',
        input: {totalRows: 3, boardShape: 'RECTANGLE'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0},
            {col: 0, row: 1}, {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1},
            {col: 0, row: 2}, {col: 1, row: 2}, {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2},
        ],
    });

    testCases.push({
        title: 'a bigger very example rectangular board',
        input: {totalRows: 4, boardShape: 'RECTANGLE'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0}, {col: 5, row: 0}, {col: 6, row: 0},
            {col: 0, row: 1}, {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1}, {col: 5, row: 1}, {col: 6, row: 1},
            {col: 0, row: 2}, {col: 1, row: 2}, {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2}, {col: 5, row: 2}, {col: 6, row: 2},
            {col: 0, row: 3}, {col: 1, row: 3}, {col: 2, row: 3}, {col: 3, row: 3}, {col: 4, row: 3}, {col: 5, row: 3}, {col: 6, row: 3},
        ],
    });

    testCases.push({
        title: 'an even bigger example rectangular board',
        input: {totalRows: 6, boardShape: 'RECTANGLE'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0}, {col: 5, row: 0}, {col: 6, row: 0}, {col: 7, row: 0}, {col: 8, row: 0}, {col: 9, row: 0}, {col: 10, row: 0},
            {col: 0, row: 1}, {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1}, {col: 5, row: 1}, {col: 6, row: 1}, {col: 7, row: 1}, {col: 8, row: 1}, {col: 9, row: 1}, {col: 10, row: 1},
            {col: 0, row: 2}, {col: 1, row: 2}, {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2}, {col: 5, row: 2}, {col: 6, row: 2}, {col: 7, row: 2}, {col: 8, row: 2}, {col: 9, row: 2}, {col: 10, row: 2},
            {col: 0, row: 3}, {col: 1, row: 3}, {col: 2, row: 3}, {col: 3, row: 3}, {col: 4, row: 3}, {col: 5, row: 3}, {col: 6, row: 3}, {col: 7, row: 3}, {col: 8, row: 3}, {col: 9, row: 3}, {col: 10, row: 3},
            {col: 0, row: 4}, {col: 1, row: 4}, {col: 2, row: 4}, {col: 3, row: 4}, {col: 4, row: 4}, {col: 5, row: 4}, {col: 6, row: 4}, {col: 7, row: 4}, {col: 8, row: 4}, {col: 9, row: 4}, {col: 10, row: 4},
            {col: 0, row: 5}, {col: 1, row: 5}, {col: 2, row: 5}, {col: 3, row: 5}, {col: 4, row: 5}, {col: 5, row: 5}, {col: 6, row: 5}, {col: 7, row: 5}, {col: 8, row: 5}, {col: 9, row: 5}, {col: 10, row: 5},
        ],
    });

    testCases.push({
        title: 'very basic example triangle board',
        input: {totalRows: 3, boardShape: 'TRIANGLE'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0},
                              {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1},
                                                {col: 2, row: 2},
        ],
    });

    testCases.push({
        title: 'a bigger triangle board',
        input: {totalRows: 4, boardShape: 'TRIANGLE'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0}, {col: 5, row: 0}, {col: 6, row: 0},
                              {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1}, {col: 5, row: 1},
                                                {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2},
                                                                  {col: 3, row: 3},
        ],
    });

    testCases.push({
        title: 'minimal possible hexagonal board (same result as for RECTANGLE in this case)',
        input: {totalRows: 2, boardShape: 'HEXAGON'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0},
            {col: 0, row: 1}, {col: 1, row: 1}, {col: 2, row: 1},
        ],
    });

    testCases.push({
        title: 'very basic example hexagonal board',
        input: {totalRows: 4, boardShape: 'HEXAGON'},
        output: [
                              {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0}, {col: 5, row: 0},
            {col: 0, row: 1}, {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1}, {col: 5, row: 1}, {col: 6, row: 1},
            {col: 0, row: 2}, {col: 1, row: 2}, {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2}, {col: 5, row: 2}, {col: 6, row: 2},
                              {col: 1, row: 3}, {col: 2, row: 3}, {col: 3, row: 3}, {col: 4, row: 3}, {col: 5, row: 3},
        ],
    });

    testCases.push({
        title: 'an even bigger example hex board ' + `
    ▲▼▲▼▲▼▲                         
   ▲▼▲▼▲▼▲▼▲                    
  ▲▼▲▼▲▼▲▼▲▼▲                    
  ▼▲▼▲▼▲▼▲▼▲▼                   
   ▼▲▼▲▼▲▼▲▼                 
    ▼▲▼▲▼▲▼         
`,
        input: {totalRows: 6, boardShape: 'HEXAGON'},
        output: [
                                                {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0}, {col: 5, row: 0}, {col: 6, row: 0}, {col: 7, row: 0}, {col: 8, row: 0},
                              {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1}, {col: 5, row: 1}, {col: 6, row: 1}, {col: 7, row: 1}, {col: 8, row: 1}, {col: 9, row: 1},
            {col: 0, row: 2}, {col: 1, row: 2}, {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2}, {col: 5, row: 2}, {col: 6, row: 2}, {col: 7, row: 2}, {col: 8, row: 2}, {col: 9, row: 2}, {col: 10, row: 2},
            {col: 0, row: 3}, {col: 1, row: 3}, {col: 2, row: 3}, {col: 3, row: 3}, {col: 4, row: 3}, {col: 5, row: 3}, {col: 6, row: 3}, {col: 7, row: 3}, {col: 8, row: 3}, {col: 9, row: 3}, {col: 10, row: 3},
                              {col: 1, row: 4}, {col: 2, row: 4}, {col: 3, row: 4}, {col: 4, row: 4}, {col: 5, row: 4}, {col: 6, row: 4}, {col: 7, row: 4}, {col: 8, row: 4}, {col: 9, row: 4},
                                                {col: 2, row: 5}, {col: 3, row: 5}, {col: 4, row: 5}, {col: 5, row: 5}, {col: 6, row: 5}, {col: 7, row: 5}, {col: 8, row: 5},
        ],
    });

    return testCases.map(tc => [tc]);
};

module.exports = class extends TestCase {
    test_generateBoardShape({input, output}) {
        const actual = GenerateBoard.generateBoardShape(input);
        this.assertSubTree(output, actual);
    }

    getTestMapping() {
        return [
            [provide__generateBoardShape, this.test_generateBoardShape],
        ];
    }
};