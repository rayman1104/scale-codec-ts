import { ScaleDecoder } from '../app';
import { fillBytesToLength, hexToBytes, InvalidScaleTypeValueError } from '../utils';

test('compact_integers_decoded_as_expected', () => {
  const u16max = 65535;
  const u32max = (1n << 32n) - 1n;
  const u64max = (1n << 64n) - 1n;
  const tests: Array<[number | bigint, string]> = [
    [0, "00"],
    [6, "18"],
    [63, "fc"],
    [64, "01 01"],
    [16383, "fd ff"],
    [16384, "02 00 01 00"],
    [1000000, "02 09 3d 00"],
    [1073741823, "fe ff ff ff"],
    [1073741824, "03 00 00 00 40"],
    [Number((1n << 32n) - 1n), "03 ff ff ff ff"],
    [1n << 32n, "07 00 00 00 00 01"],
    [1n << 40n, "0b 00 00 00 00 00 01"],
    [1n << 48n, "0f 00 00 00 00 00 00 01"],
    [(1n << 56n) - 1n, "0f ff ff ff ff ff ff ff"],
    [1n << 56n, "13 00 00 00 00 00 00 00 01"],
    [u64max, "13 ff ff ff ff ff ff ff ff"],
  ];
  tests.forEach(([ans, raw]) => {
    console.log(`expect ${ans}; hex: ${raw}`);
    const bytes = hexToBytes(raw);
    const decoder = new ScaleDecoder(fillBytesToLength(bytes, 9));
    const res = decoder.processAndUpdateData("Compact<u64>");
    expect(res).toBe(BigInt(ans));
    if (ans <= u32max) {
      const decoder = new ScaleDecoder(fillBytesToLength(bytes, 5));
      const res = decoder.processAndUpdateData("Compact<u32>");
      expect(res).toBe(ans);
    }
    if (ans <= u16max) {
      const decoder = new ScaleDecoder(fillBytesToLength(bytes, 3));
      const res = decoder.processAndUpdateData("Compact<u16>");
      expect(res).toBe(ans);
    }
    if (ans <= 255) {
      const decoder = new ScaleDecoder(hexToBytes(raw));
      const res = decoder.processAndUpdateData("Compact<u8>");
      expect(res).toBe(ans);
    }
  });
});

test('test_i16', () => {
  const raw = "0x2efb";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("i16");
  expect(res).toBe(-1234);
});

test('test_u16', () => {
  const raw = "0x2efb";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("u16");
  expect(res).toBe(64302);
});

test('test_u32', () => {
  const raw = "64000000";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("u32");
  expect(res).toBe(100);
});

test('test_u64', () => {
  const raw = "64" + "00".repeat(7);
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("u64");
  expect(res).toBe(100n);
});

test('test_u128', () => {
  const raw = "64" + "00".repeat(15);
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("u64");
  expect(res).toBe(100n);
});

test('test_bool_true', () => {
  const raw = "0x01";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("bool");
  expect(res).toBe(true);
});

test('test_bool_false', () => {
  const raw = "0x00";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("bool");
  expect(res).toBe(false);
});

test('test_bool_invalid', () => {
  const raw = "0x02";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const decode = () => decoder.processAndUpdateData("bool");
  expect(decode).toThrow(InvalidScaleTypeValueError);
});

test('test_string', () => {
  const raw = "1054657374";
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("String");
  expect(res).toBe("Test");
});

test('test_option_some', () => {
  const raw = '0x012efb';
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("Option<u16>");
  expect(res).toBe(64302);
})

test('test_option_none', () => {
  const raw = '0x002efb';
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("Option<u16>");
  expect(res).toBe(null);
})

test('test_option_bool', () => {
  const raw = '0x02';
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("Option<bool>");
  expect(res).toBe(false);
})

test('test_result_ok', () => {
  const raw = '0x002efb';
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("Result<u16, i16>");
  expect(res).toEqual({ Ok: 64302});
})

test('test_result_error', () => {
  const raw = '0x012efb';
  const decoder = new ScaleDecoder(hexToBytes(raw));
  const res = decoder.processAndUpdateData("Result<i16, i16>");
  expect(res).toEqual({ Error: -1234});
})
