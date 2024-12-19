const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

// Read the source file
const sourceCode = fs.readFileSync('js/game.js', 'utf8');

// Minimal obfuscation settings for maximum compatibility
const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
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
    transformObjectKeys: false,
    unicodeEscapeSequence: false
});

// Write the obfuscated code
fs.writeFileSync('js/game.min.js', obfuscationResult.getObfuscatedCode());

console.log('Game code has been obfuscated successfully!'); 