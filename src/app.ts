import { bytesToDataview, InvalidScaleTypeValueError } from './utils';

export class ScaleDecoder {
  data: DataView;
  offset: number;

  constructor(bytes: number[]) {
    this.data = bytesToDataview(bytes);
    this.offset = 0;
  }

  getNextU8() {
    return this.data.getUint8(this.offset++);
  }

  getNextBool() {
    const byte = this.getNextU8();
    if (![0, 1].includes(byte)) {
      throw new InvalidScaleTypeValueError('Invalid value for datatype "bool"');
    }
    return byte === 1;
  }

  processResult(subtype: string) {
    const resultByte = this.getNextU8();
    const types = subtype.split(',').map(type => type.trim());
    if (types.length != 2) {
      throw new InvalidScaleTypeValueError('Invalid subtypes for the Result type');
    }
    if (resultByte == 0) {
      return { Ok: this.processAndUpdateData(types[0]) };
    } else if (resultByte == 1) {
      return { Error: this.processAndUpdateData(types[1]) };
    } else {
      throw new InvalidScaleTypeValueError('Illegal data for the Result type');
    }
  }

  processOption(subtype: string) {
    const optionByte = this.getNextU8();
    if (subtype && optionByte) {
      if (subtype === 'bool') {
        switch (optionByte) {
          case 1:
            return true;
          case 2:
            return false;
          default:
            throw new InvalidScaleTypeValueError('Illegal data for the Option<bool> type');
        }
      }
      return this.processAndUpdateData(subtype);
    }
    return null;
  }

  processCompact(subtype: string): number | bigint {
    const compactByte = this.getNextU8();
    let ans: number;
    switch (compactByte % 4) {
      case 0:
        ans = compactByte >>> 2;
        break;
      case 1:
        ans = this.data.getUint16(this.offset - 1, true) >>> 2;
        break;
      case 2:
        ans = this.data.getUint32(this.offset - 1, true) >>> 2;
        break;
      default:
        return this.processAndUpdateData(subtype);
    }
    if (['u64', 'u128', 'i64', 'i128'].includes(subtype)) {
      return BigInt(ans);
    }
    return ans;
  }

  processVec(subtype: string) {
    const elementCount = this.processCompact('u32');
    const result = [];
    for (let i = 0; i < elementCount; i++) {
      const elem = this.processAndUpdateData(subtype);
      result.push(elem);
    }
    return result;
  }

  processStr() {
    const array = this.processVec('u8');
    let result = "";
    for (let i = 0; i < array.length; i++) {
      result += String.fromCharCode(array[i]);
    }
    return result;
  }

  processAndUpdateData(typeString: string): any {
    let type = typeString;
    let subtype = '';

    // complex type
    if (type[type.length - 1] === '>') {
      const typeParts = typeString.match(/^([^<]*)<(.+)>$/);
      if (!typeParts?.length) {
        throw new InvalidScaleTypeValueError('Wrong type');
      }
      type = typeParts[1];
      subtype = typeParts[2];
    }

    let offset: number;
    let lo, hi: bigint;

    switch (type) {
      case 'Result':
        return this.processResult(subtype);
      case 'Option':
        return this.processOption(subtype);
      case 'String':
        return this.processStr();
      case 'Vec':
        return this.processVec(subtype);
      case 'Compact':
        return this.processCompact(subtype);
      case 'bool':
        return this.getNextBool();
      case 'u8':
        return this.getNextU8();
      case 'u16':
        [offset, this.offset] = [this.offset, this.offset + 2];
        return this.data.getUint16(offset, true);
      case 'u32':
        [offset, this.offset] = [this.offset, this.offset + 4];
        return this.data.getUint32(offset, true);
      case 'u64':
        [offset, this.offset] = [this.offset, this.offset + 8];
        return this.data.getBigUint64(offset, true);
      case 'u128':
        lo = this.data.getBigUint64(this.offset, true);
        hi = this.data.getBigUint64(this.offset + 8, true);
        this.offset += 16;
        return (hi << 64n) + lo;
      case 'i8':
        return this.data.getInt8(this.offset++);
      case 'i16':
        [offset, this.offset] = [this.offset, this.offset + 2];
        return this.data.getInt16(offset, true);
      case 'i32':
        [offset, this.offset] = [this.offset, this.offset + 4];
        return this.data.getInt32(offset, true);
      case 'i64':
        [offset, this.offset] = [this.offset, this.offset + 8];
        return this.data.getBigInt64(offset, true);
      case 'i128':
        lo = this.data.getBigUint64(this.offset, true);
        hi = this.data.getBigInt64(this.offset + 8, true);
        this.offset += 16;
        return (hi << 64n) + lo;
      default:
        throw new InvalidScaleTypeValueError(`Unknown type (${type})`);
    }
  }
}
