export function bytesToDataview(bytes: number[]): DataView {
  const data = new DataView(new ArrayBuffer(bytes.length));
  for (let i = 0; i < bytes.length; i++) {
    data.setUint8(i, bytes[i]);
  }
  return data;
}

export function hexToBytes(hex: string): number[] {
  if (hex.indexOf('0x') === 0) {
    hex = hex.substring(2);
  }
  hex = hex.replace(/\s+/g, ''); // remove spaces

  const bytes: number[] = [];
  for (let c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substring(c, c+2), 16));
  return bytes;
}

export function bytesToHex(bytes: number[]): string {
  const hex = [];
  for (let i = 0; i < bytes.length; i++) {
    const current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xF).toString(16));
  }
  return hex.join("");
}

export function fillBytesToLength(bytes: number[], n: number) {
  return (bytes.length < n)
    ? [...bytes, ...Array<number>(n - bytes.length).fill(0)]
    : bytes;
}

export class InvalidScaleTypeValueError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, InvalidScaleTypeValueError.prototype);
  }
}
