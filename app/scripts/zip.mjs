// A .zip of files, written by hand (Phase 15.4, for the press kit): no runtime dependencies,
// Node's own deflate and CRC-32. Every entry is deflated, dated 1 Jan 1980 so the same files
// make the same zip.
import { crc32, deflateRawSync } from 'node:zlib';

// `files`: [name in the zip, its bytes]. The zip's bytes.
export function zip(files) {
  const local = [];
  const central = [];
  let at = 0;
  for (const [name, data] of files) {
    const path = Buffer.from(name, 'utf8');
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4); // version needed
    head.writeUInt16LE(0x0800, 6); // names in UTF-8
    head.writeUInt16LE(8, 8); // deflate
    head.writeUInt16LE(0, 10); // 00:00
    head.writeUInt16LE(0x21, 12); // 1 Jan 1980
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(packed.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(path.length, 26);
    local.push(head, path, packed);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4); // made by
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt16LE(0, 12);
    dir.writeUInt16LE(0x21, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(packed.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(path.length, 28);
    dir.writeUInt32LE(at, 42); // where its local header is
    central.push(dir, path);
    at += head.length + path.length + packed.length;
  }
  const size = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(at, 16);
  return Buffer.concat([...local, ...central, end]);
}
