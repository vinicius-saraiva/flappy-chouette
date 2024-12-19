const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

// Read the source file
const sourceCode = fs.readFileSync('js/game.js', 'utf8');

// Enhanced name obfuscation while protecting Phaser framework
const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'mangled',
    identifiersPrefix: '_',
    renameGlobals: true,
    renameProperties: false,
    reservedNames: [
        'Phaser',
        'Game',
        'State',
        'AUTO',
        'Sprite',
        'Text',
        'Sound',
        'Physics',
        'ARCADE',
        'Keyboard'
    ],
    rotateStringArray: true,
    selfDefending: false,
    shuffleStringArray: true,
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1,
    transformObjectKeys: false
});

// Write the obfuscated code to a new file
fs.writeFileSync('js/game.min.js', obfuscationResult.getObfuscatedCode());

console.log('Game code has been obfuscated successfully!'); 