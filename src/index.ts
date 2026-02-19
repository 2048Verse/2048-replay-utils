type Dir = 'up' | 'down' | 'left' | 'right';

const newChars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","À","Á","Â","Ã","Ä","Å","Æ","Ç","È","É","Ê","Ë","Ì","Í","Î","Ï","Ð","Ñ","Ò","Ó","Ô","Õ","Ö","×","Ø","Ù","Ú","Û","Ü","Ý","Þ","ß","à","á","â","ã","ä","å","æ","ç","è","é","ê","ë","ì","í","î","ï","ð","ñ","ò","ó","ô","õ","ö","÷","ø","ù","ú","û","ü","ý","þ","ÿ","¤","¾"];
const oldChars = ["NULL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US", " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "®", "¬", "½", "¼", "¡", "«", "»", "░", "▒", "▓", "│", "┤", "Á", "Â", "À", "©", "╣", "║", "╗", "╝", "¢", "¥", "┐", "└", "┴", "┬", "├", "─", "┼", "ã", "Ã", "╚", "╔", "╩", "╦", "╠", "═", "╬", "¤", "ð", "Ð", "Ê", "Ë", "È", "ı", "Í", "Î", "Ï", "┘", "┌", "█", "▄", "¦", "Ì", "▀", "Ó", "ß", "Ô", "Ò", "õ", "Õ", "µ", "þ", "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´", "≡", "±", "‗", "¾", "¶", "§", "÷", "¸", "°", "¨", "·", "¹", "³", "²", "■", "nbsp"];

// max = Math.pow(2, 8 + 2 * i) - amt
const resolutions = [
    {
        "amt": 1,
        "max": 255
    },
    {
        "amt": 3,
        "max": 1021
    },
    {
        "amt": 12,
        "max": 4084
    },
    {
        "amt": 48,
        "max": 16336,
    },
    {
        "amt": 192,
        "max": 65344,
    },
    {
        "amt": 768,
        "max": 265966
    },
    {
        "amt": 3072,
        "max": 1050094
    },
    {
        "amt": 12288,
        "max": 4186606
    }
];

export function moveToChars(
    move: Dir,
    spawn: { value: number; x: number; y: number },
    ms: number | null
) {
    let binary = 0;
    switch (move) {
        case 'up':
            break; // 00
        case 'down':
            binary += 1; // 01
            break;
        case 'left':
            binary += 2; // 10
            break;
        case 'right':
            binary += 3; // 11
            break;
        default:
            throw new Error('Invalid move');
    }
    
    switch (spawn.value) {
        case 2:
            break; // 00xx
        case 4:
            binary += 4; // 01xx
            break;
        default:
            throw new Error('Invalid spawn value');
    }

    if (
        spawn.x >= 16 ||
        spawn.y >= 16
    ) throw new Error('Invalid spawn');

    binary += spawn.x * 16; // ???xxxx
    binary += spawn.y * 128; // ??? xxxxxxx

    if (ms !== null) { // Page not closed
        let resolution = resolutions.length - 1;
        for (let i = 0; i < resolutions.length; i++) {
            if (ms <= resolutions[i].max) {
                resolution = i;
                break;
            }
        }
        if (resolution !== 0) {
            ms = ms - resolutions[resolution - 1].max - resolutions[resolution - 1].amt;
        }
        let multiplier = Math.round(ms / resolutions[resolution].amt);

        // Keep max time reserved for page close
        if (resolution === 7 && multiplier >= 255)
            multiplier = 254;
        
        binary += resolution * 1024; // ???xxx xxxxxxx
        binary += multiplier * 8192; // ??????? ?xxxxxx xxxxxxx
    } else { // Page close
        binary += 2096128; // 1111111 1111xxx xxxxxxx
    }

    return newChars[Math.floor(binary / 16384) % 128] + 
        newChars[Math.floor(binary / 128) % 128] + 
        newChars[binary % 128];
}

export function charsToMove(chars: string) {
    if (chars.length !== 3) throw new Error('Must have exactly 3 chars');
    const binary = 
        newChars.indexOf(chars[0]) * 16384 + 
        newChars.indexOf(chars[1]) * 128 + 
        newChars.indexOf(chars[2]);
    if (binary === -1) throw new Error('Invalid chars');
    let move: Dir;
    switch (binary % 4) {
        case 0:
            move = 'up';
            break;
        case 1:
            move = 'down';
            break;
        case 2:
            move = 'left';
            break;
        case 3:
            move = 'right';
            break;
        default:
            throw new Error('Invalid move');
    }
    let value;
    switch (Math.floor(binary / 4) % 2) {
        case 0:
            value = 2;
            break;
        case 1:
            value = 4;
            break;
        default:
            throw new Error('Invalid spawn value');
    }
    const spawn = {
        x: Math.floor(binary / 16) % 8,
        y: Math.floor(binary / 128) % 8,
        value
    };
    const resolution = Math.floor(binary / 1024) % 8;
    const multiplier = Math.floor(binary / 8192);
    let ms: number | null = resolutions[resolution].amt * multiplier;
    if (resolution !== 0) {
        ms += resolutions[resolution - 1].max + resolutions[resolution - 1].amt;
    }
    if (ms === resolutions[resolutions.length - 1].max) ms = null; // Page close

    return { move, spawn, ms };
}



export function oldToNew(chars: string) {
    let newCode = '';
    for (let i = 0; i < chars.length; i++) {
        let idx = oldChars.indexOf(chars[i]);
        if (idx === -1) throw new Error('Invalid char');
        let move: Dir = 'up';
        let value;
        let spawnX;
        let spawnY;
        if (i < 2) { // Starting tiles
            const pos = idx % 16;
            value = Math.floor(idx / 16) === 2 ? 2 : 4;
            spawnX = Math.floor(pos / 4);
            spawnY = pos % 4;
        } else { // Playing tiles
            const pos = idx % 16;
            switch(Math.floor(idx / 32)) {
                case 1:
                    move = 'up';
                    break;
                case 2:
                    move = 'right';
                    break;
                case 3:
                    move = 'down';
                    break;
                case 4:
                    move = 'left';
                    break;
                default:
                    throw new Error('Invalid move');
            }
            value = ((idx - pos) % 32) / 16 ? 4 : 2;
            spawnX = Math.floor(pos / 4);
            spawnY = pos % 4;
        }
        newCode += moveToChars(move, {value, x: spawnX, y: spawnY}, null);
    }
    return newCode;
}