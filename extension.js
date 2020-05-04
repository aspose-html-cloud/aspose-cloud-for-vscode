const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const fetch = require("node-fetch");
const { v4: uuidv4 } = require('uuid');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Aspose.HTML MD Converter is now active!');

    let commandSet = [{
            'commandId': 'extension.aspose-html-md-converter.pdf',
            'callback': async function() {
                await convertMarkdown('pdf')
            }
        },
        {
            'commandId': 'extension.aspose-html-md-converter.html',
            'callback': async function() {
                await convertMarkdown('html')
            }
        },
        {
            'commandId': 'extension.aspose-html-md-converter.jpg',
            'callback': async function() {
                await convertMarkdown('jpg')
            }
        },
        {
            'commandId': 'extension.aspose-html-md-converter.exportSettings',
            'callback': exportSettings
        },
    ];
    commandSet.forEach((cmd) => {
        context.subscriptions.push(vscode.commands.registerCommand(cmd.commandId, cmd.callback));
    });
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {

}


const apiURL = 'https://vscode-markdown-converter-750605.conholdate.cloud/api/markdown';
/**
 * @param {string} conversionType
 */
async function convertMarkdown(conversionType) {

    // check active window         
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor!');
        return;
    }

    // check markdown mode          
    if (editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage("It's not a markdown mode!");
        return;
    }

    let mdfilename = editor.document.uri.fsPath;
    let ext = path.extname(mdfilename);
    if (!fs.existsSync(mdfilename)) {
        if (editor.document.isUntitled) {
            vscode.window.showWarningMessage('File not saved. Please, save before converting!');
            return;
        }
        vscode.window.showWarningMessage('Can\'t get a filename!');
        return;
    };

    let data = {
        machineId: vscode.env.machineId,
        content: editor.document.getText(),
        to: conversionType,
        paper: vscode.workspace.getConfiguration('aspose-html-md-converter')['paper']
    };

    // convert and export markdown to pdf, html
    try {
        let response = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Aspose.HTML MD Converter",
            cancellable: false
        }, (progress) => {
            progress.report({ message: "Conversion in progress..." });
            return fetch(apiURL, {
                method: 'POST',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        });

        let outputDirectory = vscode.workspace.getConfiguration('aspose-html-md-converter')['outputDirectory'] || '.';
        let outputFileName = mdfilename.replace(ext, '.' + conversionType);
        let outputFullPath = (outputDirectory !== '.') ? path.join(outputDirectory, path.basename(outputFileName)) : outputFileName;
        let blob = await response.blob();
        let readableStream = blob.stream().on('end', () => {
            vscode.window.showInformationMessage("File saved: " + outputFullPath);
        });
        let writableStream = fs.createWriteStream(outputFullPath);
        readableStream.pipe(writableStream);
    } catch (err) {
        vscode.window.showErrorMessage(`Aspose.HTML MD Converter: ${err.message}`);
        return;
    }
}

/**
 * @description Export config to external file
 */
function exportSettings() {
    let outputDirectory = vscode.workspace.getConfiguration('aspose-html-md-converter')['outputDirectory'] || '.';
    if (outputDirectory === '.') {
        outputDirectory = (vscode.workspace.workspaceFolders !== undefined) ?
            vscode.workspace.workspaceFolders[0].uri.fsPath :
            path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
    }
    let configFileName = path.join(outputDirectory, "aspose-html-converter-settings.json");
    let jsonContent = JSON.stringify(vscode.workspace.getConfiguration('aspose-html-md-converter'));
    fs.writeFile(configFileName, jsonContent, 'utf8', function(err) {
        if (err) {
            vscode.window.showErrorMessage(`Aspose.HTML MD Converter: ${err.message}`);
            return;
        }
        vscode.window.showInformationMessage(`Saved to: ${configFileName}`);
    });
}
module.exports = {
    activate,
    deactivate
}