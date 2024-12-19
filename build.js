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
    stringArrayEncoding: ['none'],
    stringArrayThreshold: 0.8,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
});

// Write the obfuscated code with proper file permissions
fs.writeFileSync('js/game.min.js', obfuscationResult.getObfuscatedCode(), {
    encoding: 'utf8',
    mode: 0o644
});

console.log('Game code has been obfuscated successfully!'); 