import { ScaleDecoder } from './src/app';
import { hexToBytes } from './src/utils';
const decoder = new ScaleDecoder(hexToBytes("1054657374"));
const res = decoder.processAndUpdateData("String");
console.log(res); // outputs 'Test'
