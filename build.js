const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

// Read the source file
const sourceCode = fs.readFileSync('js/game.js', 'utf8');

// Simplified obfuscation settings for better compatibility
const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    identifiersPrefix: '',
    renameGlobals: false,
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
    rotateStringArray: false,
    selfDefending: false,
    shuffleStringArray: false,
    splitStrings: false,
    stringArray: false,
    stringArrayEncoding: ['none'],
    stringArrayThreshold: 0,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
});

// Write the obfuscated code with explicit UTF-8 encoding
fs.writeFileSync('js/game.min.js', obfuscationResult.getObfuscatedCode(), 'utf8');

console.log('Game code has been obfuscated successfully!'); 