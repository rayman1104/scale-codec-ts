# SCALE Codec in Typescript
The SCALE (Simple Concatenated Aggregate Little-Endian) Codec is
a lightweight, efficient, binary serialization and deserialization codec.

This is a lightweight implementation of [SCALE for Substrate](https://docs.substrate.io/v3/advanced/scale-codec/#implementations) for Typescript.

## Features
Decode:
- Int8, Int32, Int64, Int128, UInt8, UInt32, UInt64, UInt128
- Option
- Result
- Bool
- Vector
- String

## Install dependencies
```bash
yarn
```

## Test
```bash
yarn test
```

## Usage
```bash
ts-node example.ts
```

example.ts:
```ts
import { ScaleDecoder } from './src/app';
import { hexToBytes } from './src/utils';
const decoder = new ScaleDecoder(hexToBytes("1054657374"));
const res = decoder.processAndUpdateData("String");
console.log(res); // outputs 'Test'
```
