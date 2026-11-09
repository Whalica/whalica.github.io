/**
 * 极简 ZIP 生成器（store 模式，不压缩）。
 * 只为“把几篇 .md 打包下载”服务，避免为一个小功能引入第三方依赖。
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const DOS_TIME = 0;
const DOS_DATE = 0x0021; // 1980-01-01，固定值保证输出可复现

export function createZip(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const items = entries.map((entry) => ({
    name: encoder.encode(entry.name),
    data: entry.data,
    crc: crc32(entry.data),
  }));

  let cursor = 0;
  const localOffsets: number[] = [];
  for (const item of items) {
    localOffsets.push(cursor);
    cursor += 30 + item.name.length + item.data.length;
  }
  const centralOffset = cursor;
  for (const item of items) cursor += 46 + item.name.length;
  const totalSize = cursor + 22;

  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);
  let offset = 0;

  for (const [index, item] of items.entries()) {
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 20, true);
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 文件名
    view.setUint16(offset + 8, 0, true); // store
    view.setUint16(offset + 10, DOS_TIME, true);
    view.setUint16(offset + 12, DOS_DATE, true);
    view.setUint32(offset + 14, item.crc, true);
    view.setUint32(offset + 18, item.data.length, true);
    view.setUint32(offset + 22, item.data.length, true);
    view.setUint16(offset + 26, item.name.length, true);
    view.setUint16(offset + 28, 0, true);
    output.set(item.name, offset + 30);
    output.set(item.data, offset + 30 + item.name.length);
    offset += 30 + item.name.length + item.data.length;
    void index;
  }

  for (const [index, item] of items.entries()) {
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true); // version made by
    view.setUint16(offset + 6, 20, true); // version needed
    view.setUint16(offset + 8, 0x0800, true);
    view.setUint16(offset + 10, 0, true);
    view.setUint16(offset + 12, DOS_TIME, true);
    view.setUint16(offset + 14, DOS_DATE, true);
    view.setUint32(offset + 16, item.crc, true);
    view.setUint32(offset + 20, item.data.length, true);
    view.setUint32(offset + 24, item.data.length, true);
    view.setUint16(offset + 28, item.name.length, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    view.setUint16(offset + 34, 0, true);
    view.setUint16(offset + 36, 0, true);
    view.setUint32(offset + 38, 0, true);
    view.setUint32(offset + 42, localOffsets[index], true);
    output.set(item.name, offset + 46);
    offset += 46 + item.name.length;
  }

  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, items.length, true);
  view.setUint16(offset + 10, items.length, true);
  view.setUint32(offset + 12, offset - centralOffset, true);
  view.setUint32(offset + 16, centralOffset, true);
  view.setUint16(offset + 20, 0, true);

  return output;
}
