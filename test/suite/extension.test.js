const assert = require('assert');
const fs = require('fs')
const path = require('path');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
//const myExtension = require('../extension');

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Conversion Test', async() => {
        let mdFileName = path.join(__dirname + '/test.md');
        let htmlFileName = path.join(__dirname + '/test.html');
        let pdfFileName = path.join(__dirname + '/test.pdf');
        const uri = vscode.Uri.file(mdFileName);
        const document = await vscode.workspace.openTextDocument(uri)
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('extension.aspose-cloud.html');
        await vscode.commands.executeCommand('extension.aspose-cloud.pdf');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        fs.readFile(htmlFileName, (err, data) => {
            assert.equal(err, null);
            assert.ok(data[0].startsWith('<html>'));

        });
        fs.unlinkSync(htmlFileName);

        fs.readFile(pdfFileName, (err, data) => {
            assert.equal(err, null);
            assert.ok(data[0].startsWith('%PDF-'));

        });
        fs.unlinkSync(pdfFileName);

    });
});