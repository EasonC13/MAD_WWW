import forge from "node-forge";

export function encryptWithAES256CBC(
  toEncrypt: string,
  encryptionKey: string,
  iv: string
): string {
  const keyBuffer = forge.util.createBuffer(
    forge.util.hexToBytes(encryptionKey),
    "raw"
  );
  const ivBuffer = forge.util.createBuffer(iv, "raw");

  const cipher = forge.cipher.createCipher("AES-CBC", keyBuffer.getBytes(32));
  cipher.start({ iv: ivBuffer.getBytes(16) });
  cipher.update(forge.util.createBuffer(toEncrypt, "utf8"));
  cipher.finish();

  const encryptedHex = cipher.output.toHex();
  return encryptedHex;
}

export function decryptWithAES256CBC(
  toDecrypt: string,
  encryptionKey: string,
  iv: string
): string {
  const encryptedBytes = forge.util.hexToBytes(toDecrypt);

  const keyBuffer = forge.util.createBuffer(
    forge.util.hexToBytes(encryptionKey),
    "raw"
  );
  const ivBuffer = forge.util.createBuffer(iv, "raw");

  const decipher = forge.cipher.createDecipher(
    "AES-CBC",
    keyBuffer.getBytes(32)
  );
  decipher.start({ iv: ivBuffer.getBytes(16) });
  decipher.update(forge.util.createBuffer(encryptedBytes, "raw"));
  const result = decipher.finish();

  if (result) {
    return decipher.output.toString(); // Returns decrypted text
  } else {
    throw new Error("Decryption failed");
  }
}

export function calculateSHA256(inputString: string): string {
  const md = forge.md.sha256.create();
  md.update(inputString);
  return md.digest().toHex();
}
