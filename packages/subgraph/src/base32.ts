import { Bytes } from '@graphprotocol/graph-ts';

// Encode using Base32 (RFC3548, RFC4648)
export function encode(word: Bytes): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let output = '';

  // Go through each block of 5 bits
  for (let i = 0; i < word.length * 8; i+=5) {
    // Determine byte position

    // How many bits should be skipped in the byte
    const skip: u8 = (i % 8) as u8; // eslint-disable-line
    const firstByteIndex = (i - skip) / 8; // Position of the first byte in the binary string
    let alphabetIndex = 0;

    // There is no overlap with the next byte
    if (skip < 3) {
      // Shift byte to right
      alphabetIndex = word[firstByteIndex] >> (3 - skip);

      // Enforce three leading bits as zeroes
      alphabetIndex = alphabetIndex & 0x1f;
    }

    // We need to extract part of the next byte
    else {
      // Force leading zeros
      let leftBits = word[firstByteIndex] & (0xff >> skip);

      // Move bits to left
      leftBits = leftBits << (skip - 3);

      // Get the next byte, defaulting to zeroes
      let rightBits = firstByteIndex + 1 < word.length ? word[firstByteIndex + 1] : 0x00;

      // Move to right
      rightBits = rightBits >> (11 - skip);

      // Concatenate the two parts
      alphabetIndex = leftBits | rightBits;

    }

    // Add the associated code from the alphabet
    output += alphabet[alphabetIndex];

  }

  return output;
}
