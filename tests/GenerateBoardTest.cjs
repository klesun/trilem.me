const GenerateBoard = require('../src/GenerateBoard.js');
const TestCase = require('klesun-node-tools/src/Transpiled/Lib/TestCase.js');

const provide__generateBoardShape = () => {
    const testCases = [];

    testCases.push({
        title: 'very basic example square board',
        input: {totalRows: 3, boardShape: 'SQUARE'},
        output: [
            {col: 0, row: 0}, {col: 1, row: 0}, {col: 2, row: 0}, {col: 3, row: 0}, {col: 4, row: 0},
            {col: 0, row: 1}, {col: 1, row: 1}, {col: 2, row: 1}, {col: 3, row: 1}, {col: 4, row: 1},
            {col: 0, row: 2}, {col: 1, row: 2}, {col: 2, row: 2}, {col: 3, row: 2}, {col: 4, row: 2},
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