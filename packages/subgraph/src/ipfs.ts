import {
  ipfs,
  Bytes,
  json,
  JSONValue,
  log,
  JSONValueKind
} from '@graphprotocol/graph-ts';

import { encode } from './base32';

// This function creates a CID v1 from the kccek256 hash of the JSON file
// Spec: https://github.com/multiformats/cid
export function cidFromHash(orgJsonHash: Bytes): string {
  // Determine CID values
  const version = 0x01 // CIDv1 - https://github.com/multiformats/multicodec
  const codec = 0x55 // raw - https://github.com/multiformats/multicodec
  const multihashFunctionType = 0x1b // keccak-256 - https://multiformats.io/multihash/
  const multihashDigestlength = 0x20 // 256 bits   - https://multiformats.io/multihash/
  let multihashDigestValue  = orgJsonHash // Hex string without 0x prefix

  // Construct CID Raw Hex string
  let rawCid = new Bytes(orgJsonHash.length + 4)
  rawCid[0] = version;
  rawCid[1] = codec;
  rawCid[2] = multihashFunctionType;
  rawCid[3] = multihashDigestlength;

  for (let i = 0; i < multihashDigestValue.length; i++) {
    rawCid[i+4] = multihashDigestValue[i];
  }

  // Add `b` prefix for base32 - https://github.com/multiformats/multibase
  return 'b' + encode(rawCid);
}

// Retrieve IPFS Data as JSON
// Uses .cat() to protect against timeouts or unpinned files
export function getJson(ipfsCid: string, expectkind: JSONValueKind): JSONValue | null {
  // Retrieve the Organization from IPFS
  let jsonBytes = ipfs.cat(ipfsCid);

  if (!jsonBytes) {
    log.warning('IPFS|{}|Could not retrieve CID', [ipfsCid]);
    return null;
  }

  // Extract JSON document
  let jsonValue = json.fromBytes(jsonBytes as Bytes);
  if (!jsonValue) {
    log.warning('IPFS|{}|Data retrieved is not JSON', [ipfsCid]);
    return null;
  }

  if (jsonValue.kind != expectkind) {
    log.warning('IPFS|{}|JSON retrieved is not the expected kind', [ipfsCid]);
    return null;
  }

  return jsonValue
}
