type Dir = 'up' | 'down' | 'left' | 'right';

export const oldRegex = /^replay((:|_)(\dx\d)?)?/gm;
export const newRegex = /^\d{1,}x\d{1,}-[^_]*_/gm;

const newChars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","À","Á","Â","Ã","Ä","Å","Æ","Ç","È","É","Ê","Ë","Ì","Í","Î","Ï","Ð","Ñ","Ò","Ó","Ô","Õ","Ö","×","Ø","Ù","Ú","Û","Ü","Ý","Þ","ß","à","á","â","ã","ä","å","æ","ç","è","é","ê","ë","ì","í","î","ï","ð","ñ","ò","ó","ô","õ","ö","÷","ø","ù","ú","û","ü","ý","þ","ÿ","¤","¾"];
const oldChars = ["NULL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US", " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "®", "¬", "½", "¼", "¡", "«", "»", "░", "▒", "▓", "│", "┤", "Á", "Â", "À", "©", "╣", "║", "╗", "╝", "¢", "¥", "┐", "└", "┴", "┬", "├", "─", "┼", "ã", "Ã", "╚", "╔", "╩", "╦", "╠", "═", "╬", "¤", "ð", "Ð", "Ê", "Ë", "È", "ı", "Í", "Î", "Ï", "┘", "┌", "█", "▄", "¦", "Ì", "▀", "Ó", "ß", "Ô", "Ò", "õ", "Õ", "µ", "þ", "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´", "≡", "±", "‗", "¾", "¶", "§", "÷", "¸", "°", "¨", "·", "¹", "³", "²", "■", "nbsp"];

// Bit position constants
const MOVE_SHIFT = 0;
const SPAWN_VALUE_SHIFT = 2;
const SPAWN_X_SHIFT = 4;
const SPAWN_Y_SHIFT = 7;
const RESOLUTION_SHIFT = 10;
const MULTIPLIER_SHIFT = 13;

// Bit masks
const MOVE_MASK = 0b11;
const SPAWN_VALUE_MASK = 0b11;
const SPAWN_POSITION_MASK = 0b111;
const RESOLUTION_MASK = 0b111;
const MULTIPLIER_MASK = 0b11111111;
const PAGE_CLOSE_MARKER = 0b11111111; // 255

const resolutions = [
    { amt: 1, max: 255 },
    { amt: 3, max: 1021 },
    { amt: 12, max: 4084 },
    { amt: 48, max: 16336 },
    { amt: 192, max: 65344 },
    { amt: 768, max: 265966 },
    { amt: 3072, max: 1050094 },
    { amt: 12288, max: 4186606 }
];

export function encodeMove(
    move: Dir,
    spawn: { value: number; x: number; y: number },
    ms: number | null
) {
    // Validate inputs
    switch (move) {
        case 'up':
        case 'down':
        case 'left':
        case 'right':
            break;
        default:
            throw new Error('Invalid move');
    }

    switch (spawn.value) {
        case 2:
        case 4:
            break;
        default:
            throw new Error('Invalid spawn value');
    }

    if (spawn.x >= 8 || spawn.y >= 8) {
        throw new Error('Invalid spawn position (max 7)');
    }

    let binary = 0;

    // Direction (2 bits: 0-3)
    const moveValue = { up: 0, down: 1, left: 2, right: 3 }[move];
    binary |= (moveValue & MOVE_MASK) << MOVE_SHIFT;

    // Spawn value (2 bits: 0=2, 1=4)
    binary |= ((spawn.value === 4 ? 1 : 0) & SPAWN_VALUE_MASK) << SPAWN_VALUE_SHIFT;

    // Spawn position (3 bits each for x and y)
    binary |= (spawn.x & SPAWN_POSITION_MASK) << SPAWN_X_SHIFT;
    binary |= (spawn.y & SPAWN_POSITION_MASK) << SPAWN_Y_SHIFT;

    // Time encoding (3 bits resolution + 8 bits multiplier)
    if (ms !== null) {
        // Find appropriate resolution
        let resolution = 0;
        for (let i = 0; i < resolutions.length; i++) {
            if (ms <= resolutions[i].max) {
                resolution = i;
                break;
            }
        }

        // Calculate time offset within resolution
        let timeOffset = ms;
        if (resolution > 0) {
            timeOffset -= resolutions[resolution - 1].max + resolutions[resolution - 1].amt;
        }

        // Calculate multiplier (clamped to max value)
        let multiplier = Math.floor(timeOffset / resolutions[resolution].amt);
        if (resolution === 7 && multiplier >= 254) multiplier = 254;

        binary |= (resolution & RESOLUTION_MASK) << RESOLUTION_SHIFT;
        binary |= (multiplier & MULTIPLIER_MASK) << MULTIPLIER_SHIFT;
    } else {
        // Page close marker (resolution=7, multiplier=255)
        binary |= (7 & RESOLUTION_MASK) << RESOLUTION_SHIFT;
        binary |= (PAGE_CLOSE_MARKER & MULTIPLIER_MASK) << MULTIPLIER_SHIFT;
    }

    // Convert to 3-character string using base-128 encoding
    return newChars[(binary >> 14) & 0b1111111] + 
           newChars[(binary >> 7) & 0b1111111] + 
           newChars[binary & 0b1111111];
}

export function parseChars(chars: string) {
    if (chars.length !== 3) throw new Error('Must have exactly 3 chars');

    // Convert from base-128 to binary
    const binary = 
        (newChars.indexOf(chars[0]) << 14) + 
        (newChars.indexOf(chars[1]) << 7) + 
        newChars.indexOf(chars[2]);

    if (binary === -1) throw new Error('Invalid chars');

    // Extract move direction
    const moveValue = (binary >> MOVE_SHIFT) & MOVE_MASK;
    let move: Dir;
    switch (moveValue) {
        case 0: move = 'up'; break;
        case 1: move = 'down'; break;
        case 2: move = 'left'; break;
        case 3: move = 'right'; break;
        default: throw new Error('Invalid move in encoded data');
    }

    // Extract spawn value
    const spawnValueBit = (binary >> SPAWN_VALUE_SHIFT) & SPAWN_VALUE_MASK;
    const spawnValue = spawnValueBit === 1 ? 4 : 2;

    // Extract spawn position
    const spawnX = (binary >> SPAWN_X_SHIFT) & SPAWN_POSITION_MASK;
    const spawnY = (binary >> SPAWN_Y_SHIFT) & SPAWN_POSITION_MASK;

    // Extract time information
    const resolution = (binary >> RESOLUTION_SHIFT) & RESOLUTION_MASK;
    const multiplier = (binary >> MULTIPLIER_SHIFT) & MULTIPLIER_MASK;

    let ms: number | null = null;
    if (resolution !== 7 || multiplier !== PAGE_CLOSE_MARKER) {
        ms = resolutions[resolution].amt * multiplier;
        if (resolution > 0) {
            ms += resolutions[resolution - 1].max + resolutions[resolution - 1].amt;
        }
    }

    return {
        move,
        spawn: { value: spawnValue, x: spawnX, y: spawnY },
        ms
    };
}

export function oldToNew(chars: string) {
    let newCode = '';
    for (let i = 0; i < chars.length; i++) {
        let idx = oldChars.indexOf(chars[i]);
        if (idx === -1) throw new Error('Invalid char');

        let move: Dir = 'up';
        let value: number;
        let spawnX: number;
        let spawnY: number;

        if (i < 2) { // Starting tiles
            const pos = idx % 16;
            value = Math.floor(idx / 16) === 2 ? 2 : 4;
            spawnX = Math.floor(pos / 4);
            spawnY = pos % 4;
        } else { // Playing tiles
            const pos = idx % 16;
            switch(Math.floor(idx / 32)) {
                case 1: move = 'up'; break;
                case 2: move = 'right'; break;
                case 3: move = 'down'; break;
                case 4: move = 'left'; break;
                default: throw new Error('Invalid move');
            }
            value = ((idx - pos) % 32) / 16 ? 4 : 2;
            spawnX = Math.floor(pos / 4);
            spawnY = pos % 4;
        }

        if (spawnX >= 8 || spawnY >= 8) {
            throw new Error('Invalid spawn position in old format');
        }

        newCode += encodeMove(move, {value, x: spawnX, y: spawnY}, null);
    }
    return newCode;
}

// Board encoding
export function encodeBoard(board: number[][]): string {
    return board.flat().map(num => {
        if (num === 0) return '0';
        const value = Math.log(num) / Math.log(2);
        return value >= 10 ? String.fromCharCode(value + 87) : value.toString();
    }).join('');
}

export function decodeBoard(boardStr: string, width: number): number[][] {
    return Array.from(boardStr).map(char => {
        if (char === '0') return 0;
        const value = char >= 'a' ? char.charCodeAt(0) - 87 : parseInt(char, 10);
        return Math.pow(2, value);
    }).reduce((rows, key, index) => {
        if (index % width === 0) rows.push([]);
        rows[rows.length - 1].push(key);
        return rows;
    }, [] as number[][]);
}
