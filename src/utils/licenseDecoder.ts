import { inflate, deflate } from 'pako';

export interface LicenseData {
  person_name: string;
  id_number: string;
  date_of_birth: string;
  license_number: string;
  valid_from: string;
  valid_to: string;
  license_codes: string[];
  vehicle_restrictions: string[];
  driver_restrictions: string[];
  sex: string;
  country: string;
  format_version: string;
}

export interface DecodedResult {
  success: boolean;
  license_data: LicenseData;
  has_image: boolean;
  image_size_bytes: number;
  total_payload_size: number;
  decoding_format: string;
  message: string;
  image_base64?: string;
  image_format?: string;
  error?: string;
}

/**
 * Madagascar Driver's License Barcode Decoder
 * Ported from Python implementation for offline decoding
 */
export class MadagascarLicenseDecoder {
  // Static encryption key - MUST match the key used in barcode generation system
  // Key: 93E98969AD11D2C8162DD95DB3F69 (31 characters)
  private static readonly STATIC_ENCRYPTION_KEY = "93E98969AD11D2C8162DD95DB3F69";

  /**
   * Decode scanned barcode data to extract license information
   */
  public decodeBarcodeData(scannedData: string, skipXor: boolean = false): DecodedResult {
    try {
      console.log("=== MADAGASCAR LICENSE BARCODE DECODER ===");
      console.log("Input data:", scannedData.substring(0, 100) + "...");
      console.log("Data length:", scannedData.length);
      console.log("Data type analysis:");
      console.log("- Is hex?", /^[0-9a-fA-F]+$/.test(scannedData));
      console.log("- Has special chars?", /[^\x20-\x7E]/.test(scannedData));
      console.log("- First 10 char codes:", Array.from(scannedData.substring(0, 10)).map(c => c.charCodeAt(0)));
      
      // Step 1: Convert data to binary (detect format)
      const binaryData = this.detectAndConvertToBinary(scannedData);
      console.log(`Step 1 - Hex decode: ${scannedData.length} chars → ${binaryData.length} bytes`);
      console.log("Binary data preview:", Array.from(binaryData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Step 2: Decrypt with static key XOR (or skip if unencrypted)
      const decryptedData = skipXor ? binaryData : this.staticDecrypt(binaryData);
      console.log(`Step 2 - ${skipXor ? 'Skip XOR' : 'Decrypt'}: ${binaryData.length} → ${decryptedData.length} bytes`);
      console.log("Data preview:", Array.from(decryptedData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Check if data looks like zlib (should start with 0x78)
      if (decryptedData.length > 0) {
        console.log(`First byte: 0x${decryptedData[0].toString(16)} (zlib should start with 0x78)`);
      }
      
      // Step 3: Decompress with zlib (with fallback methods)
      const decompressedData = this.advancedDecompress(decryptedData);
      console.log(`Step 3 - Decompress: ${decryptedData.length} → ${decompressedData.length} bytes`);
      
      // Step 4: Parse pipe-delimited format
      const result = this.parseMadagascarFormat(decompressedData);
      console.log("Step 4 - Parse: License data extracted successfully");
      
      return result;
      
    } catch (error) {
      console.error("Decoding error:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        license_data: {} as LicenseData,
        has_image: false,
        image_size_bytes: 0,
        total_payload_size: 0,
        decoding_format: "pipe_delimited_xor_encrypted",
        message: "Failed to decode barcode data",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Detect data format and convert to binary
   */
  private detectAndConvertToBinary(data: string): Uint8Array {
    console.log("🔍 Detecting data format...");
    
    // Method 1: Check if it's valid hex
    const isHex = /^[0-9a-fA-F]+$/.test(data.trim()) && data.length % 2 === 0;
    if (isHex) {
      console.log("✅ Detected: Hex string");
      return this.hexToBinary(data);
    }
    
    // Method 2: Check if it's base64
    try {
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (base64Regex.test(data.trim()) && data.length % 4 === 0) {
        console.log("🧪 Trying: Base64 decode");
        const binaryString = atob(data.trim());
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        console.log("✅ Detected: Base64 string");
        return bytes;
      }
    } catch (e) {
      console.log("❌ Not valid base64");
    }
    
    // Method 3: Treat as binary text (char codes to bytes)
    console.log("🔄 Treating as binary text (char codes → bytes)");
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      bytes[i] = data.charCodeAt(i) & 0xFF; // Keep only lower 8 bits
    }
    console.log("✅ Converted text to binary data");
    return bytes;
  }

  /**
   * Convert hex string to binary data
   */
  private hexToBinary(hexData: string): Uint8Array {
    // Remove any whitespace and validate
    const cleanHex = hexData.trim().replace(/\s/g, '');
    
    if (cleanHex.length % 2 !== 0) {
      throw new Error("Invalid hex string: odd number of characters");
    }
    
    try {
      const bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
      }
      return bytes;
    } catch (error) {
      throw new Error(`Invalid hex string: ${error}`);
    }
  }

  /**
   * Decrypt data using static key XOR (length preserving)
   */
  private staticDecrypt(data: Uint8Array): Uint8Array {
    const keyBytes = new TextEncoder().encode(MadagascarLicenseDecoder.STATIC_ENCRYPTION_KEY);
    const decrypted = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      // XOR with rotating key
      const keyByte = keyBytes[i % keyBytes.length];
      decrypted[i] = data[i] ^ keyByte;
    }
    
    return decrypted;
  }

  /**
   * Advanced decompress with multiple fallback methods
   */
  private advancedDecompress(data: Uint8Array): Uint8Array {
    console.log("🔍 Advanced decompression starting...");
    
    // Method 1: Try standard zlib
    try {
      console.log("🧪 Trying standard zlib...");
      const result = inflate(data);
      console.log("✅ Standard zlib success!");
      return result;
    } catch (error) {
      console.log("❌ Standard zlib failed:", error);
    }
    
    // Method 2: Look for readable text in the encrypted data
    console.log("🔍 Searching for readable text in decrypted data...");
    let readableText = '';
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      // Check if it's a printable ASCII character or common license characters
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        readableText += String.fromCharCode(byte);
      } else {
        // Add separator for non-printable bytes
        if (readableText.length > 0 && !readableText.endsWith('|')) {
          readableText += '|';
        }
      }
    }
    
    console.log("📝 Extracted readable text:", readableText.substring(0, 200));
    
    // Method 3: Try to find pipe-delimited data patterns
    const pipePattern = /[A-Z\s]+\|[\d]+\|[\d]{8}\|[A-Z\d]+\|[\d\-]+\|[A-Z,]*\|[^|]*\|[^|]*\|[MF]/g;
    const matches = readableText.match(pipePattern);
    if (matches && matches.length > 0) {
      console.log("✅ Found pipe-delimited pattern:", matches[0]);
      
      // Check if there's image data after the license data
      const imgSeparatorIndex = readableText.indexOf('||IMG||');
      if (imgSeparatorIndex !== -1) {
        console.log("🖼️ Image data found after ||IMG|| separator");
        const fullDataWithImage = readableText; // Keep the full text including image
        return new TextEncoder().encode(fullDataWithImage);
      } else {
        return new TextEncoder().encode(matches[0]);
      }
    }
    
    // Method 4: Try partial zlib (skip corrupted parts)
    console.log("🔄 Trying partial decompression...");
    for (let skipBytes = 0; skipBytes < Math.min(50, data.length); skipBytes++) {
      try {
        const partialData = data.slice(skipBytes);
        if (partialData[0] === 0x78) { // Look for zlib header
          console.log(`🧪 Trying from byte ${skipBytes}...`);
          const result = inflate(partialData);
          console.log(`✅ Partial decompression success from byte ${skipBytes}!`);
          return result;
        }
      } catch (e) {
        // Continue trying
      }
    }
    
    // Method 5: Return the readable text we found
    if (readableText.length > 20) {
      console.log("🔄 Using extracted readable text as fallback");
      return new TextEncoder().encode(readableText);
    }
    
    throw new Error("All decompression methods failed");
  }

  /**
   * Decompress data using zlib
   */
  private decompressData(data: Uint8Array): Uint8Array {
    try {
      return inflate(data);
    } catch (error) {
      throw new Error(`Failed to decompress data: ${error}`);
    }
  }

  /**
   * Parse Madagascar pipe-delimited license format
   * Format: Name|ID|DOB|LicenseNum|ValidFrom-ValidTo|Codes|VehicleRestr|DriverRestr|Sex
   * Optional: ||IMG|| separator followed by image data
   */
  private parseMadagascarFormat(decompressedData: Uint8Array): DecodedResult {
            try {
            // Check for image separator (handle both binary and text format)
            const decompressedText = new TextDecoder().decode(decompressedData);
            const textImageSeparatorIndex = decompressedText.indexOf("||IMG||");
            
            let licenseDataBytes: Uint8Array;
            let imageBytes: Uint8Array = new Uint8Array(0);
            let hasImage = false;
            
            if (textImageSeparatorIndex !== -1) {
                // Handle text-based image data
                console.log("🖼️ Found ||IMG|| separator in text format");
                hasImage = true;
                
                const licenseDataText = decompressedText.substring(0, textImageSeparatorIndex);
                const imageDataText = decompressedText.substring(textImageSeparatorIndex + 7); // Skip "||IMG||"
                
                licenseDataBytes = new TextEncoder().encode(licenseDataText);
                
                // Convert image text back to bytes
                console.log(`📸 Converting image text to bytes: ${imageDataText.length} chars`);
                imageBytes = new Uint8Array(imageDataText.length);
                for (let i = 0; i < imageDataText.length; i++) {
                    imageBytes[i] = imageDataText.charCodeAt(i) & 0xFF;
                }
                
                console.log(`Found embedded image: ${imageBytes.length} bytes`);
            } else {
                // Try binary format
                const imageSeparator = new TextEncoder().encode("||IMG||");
                const binaryImageSeparatorIndex = this.findBytes(decompressedData, imageSeparator);
                
                if (binaryImageSeparatorIndex !== -1) {
                    console.log("🖼️ Found ||IMG|| separator in binary format");
                    hasImage = true;
                    licenseDataBytes = decompressedData.slice(0, binaryImageSeparatorIndex);
                    imageBytes = decompressedData.slice(binaryImageSeparatorIndex + imageSeparator.length);
                    console.log(`Found embedded image: ${imageBytes.length} bytes`);
                } else {
                    licenseDataBytes = decompressedData;
                    console.log("No embedded image found");
                }
            }
      
      // Parse license data string
      const licenseDataStr = new TextDecoder().decode(licenseDataBytes);
      console.log(`License data string: ${licenseDataStr}`);
      
      // Clean up the string and look for pipe-delimited data
      let cleanedStr = licenseDataStr.replace(/\0/g, '').trim(); // Remove null bytes
      
      // Try to extract a valid pipe-delimited pattern
      const pipePattern = /([A-Z\s]+)\|(\d+)\|(\d{8})\|([A-Z\d]+)\|(\d{8}-\d{8})\|([A-Z,]*)\|([^|]*)\|([^|]*)\|([MF])/;
      const match = cleanedStr.match(pipePattern);
      
      let fields: string[];
      if (match) {
        console.log("✅ Found structured license data pattern");
        fields = match.slice(1); // Remove the full match, keep groups
        console.log("Extracted fields:", fields);
      } else {
        console.log("🔄 No pattern found, trying standard pipe split");
        // Split by pipes: Name|ID|DOB|LicenseNum|ValidFrom-ValidTo|Codes|VehicleRestr|DriverRestr|Sex
        fields = cleanedStr.split('|');
        
        // Be more flexible with field count
        if (fields.length < 5) {
          throw new Error(`Expected at least 5 fields in license data, got ${fields.length}. Data: ${cleanedStr.substring(0, 100)}`);
        }
        
        // Pad missing fields
        while (fields.length < 9) {
          fields.push('');
        }
      }
      
      console.log("Final fields:", fields);
      
      // Parse valid date range
      const validDates = fields[4] ? fields[4].split('-') : ['', ''];
      const validFrom = validDates[0] || '';
      const validTo = validDates[1] || '';
      
      // Build license data object
      const licenseData: LicenseData = {
        person_name: fields[0],
        id_number: fields[1],
        date_of_birth: this.formatDate(fields[2]),
        license_number: fields[3],
        valid_from: this.formatDate(validFrom),
        valid_to: this.formatDate(validTo),
        license_codes: fields[5] ? fields[5].split(',') : [],
        vehicle_restrictions: fields[6] ? fields[6].split(',') : [],
        driver_restrictions: fields[7] ? fields[7].split(',') : [],
        sex: fields[8],
        country: "MG",
        format_version: "standardized_madagascar_v5"
      };
      
      // Build result object
      const result: DecodedResult = {
        success: true,
        license_data: licenseData,
        has_image: hasImage,
        image_size_bytes: imageBytes.length,
        total_payload_size: decompressedData.length,
        decoding_format: "pipe_delimited_xor_encrypted",
        message: `Madagascar license decoded successfully: ${licenseData.license_number}`
      };
      
      // Add image data if present
      if (hasImage && imageBytes.length > 0) {
        result.image_base64 = this.arrayBufferToBase64(imageBytes);
        
        // Try to determine image format
        console.log("🔍 Image format detection:");
        console.log("First 10 bytes:", Array.from(imageBytes.slice(0, 10)).map(b => `0x${b.toString(16)}`).join(' '));
        
        // Check for JPEG (multiple possible signatures)
        if (imageBytes.length >= 3 && 
            imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff) {
          result.image_format = "JPEG";
          console.log("✅ Detected JPEG format (standard header)");
        } else if (imageBytes.length >= 4 && 
                   imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && 
                   imageBytes[2] === 0x4e && imageBytes[3] === 0x47) {
          result.image_format = "PNG";
          console.log("✅ Detected PNG format");
        } else {
          // Check if it starts with JFIF text (JPEG File Interchange Format)
          const imageText = new TextDecoder().decode(imageBytes.slice(0, 10));
          if (imageText.startsWith('JFIF')) {
            result.image_format = "JPEG";
            console.log("✅ Detected JPEG format (JFIF header)");
          } else {
            result.image_format = "Unknown";
            console.log("❓ Unknown image format, first text:", imageText);
          }
        }
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Failed to parse license data: ${error}`);
    }
  }

  /**
   * Format date from YYYYMMDD to YYYY-MM-DD
   */
  private formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) {
      return dateStr;
    }
    
    try {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Find byte sequence in array
   */
  private findBytes(haystack: Uint8Array, needle: Uint8Array): number {
    for (let i = 0; i <= haystack.length - needle.length; i++) {
      let found = true;
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Debug method to test each step individually
   */
  public debugDecoding(scannedData: string): { [key: string]: any } {
    const debug: { [key: string]: any } = {};
    
    try {
      console.log("🔍 DEBUG: Starting step-by-step decoding");
      
      // Step 1: Hex decode
      debug.step1_input = scannedData.substring(0, 100);
      debug.step1_input_length = scannedData.length;
      
      const binaryData = this.hexToBinary(scannedData);
      debug.step1_output_length = binaryData.length;
      debug.step1_output_preview = Array.from(binaryData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      debug.step1_success = true;
      
      // Step 2: XOR decrypt
      const decryptedData = this.staticDecrypt(binaryData);
      debug.step2_output_length = decryptedData.length;
      debug.step2_output_preview = Array.from(decryptedData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      debug.step2_first_byte = `0x${decryptedData[0].toString(16)}`;
      debug.step2_is_zlib_header = decryptedData[0] === 0x78; // zlib magic number
      debug.step2_success = true;
      
      // Step 3: zlib decompress
      try {
        const decompressedData = this.decompressData(decryptedData);
        debug.step3_output_length = decompressedData.length;
        debug.step3_output_preview = new TextDecoder().decode(decompressedData.slice(0, 50));
        debug.step3_success = true;
        
        // Step 4: Parse
        try {
          const result = this.parseMadagascarFormat(decompressedData);
          debug.step4_success = true;
          debug.step4_result = result;
        } catch (parseError) {
          debug.step4_success = false;
          debug.step4_error = parseError instanceof Error ? parseError.message : 'Parse error';
        }
        
      } catch (zlibError) {
        debug.step3_success = false;
        debug.step3_error = zlibError instanceof Error ? zlibError.message : 'Zlib error';
      }
      
    } catch (error) {
      debug.general_error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    console.log("🔍 DEBUG Results:", debug);
    return debug;
  }

  /**
   * Test with a known working sample
   */
  public testWithKnownSample(): DecodedResult {
    // Create a test sample that should work
    console.log("🧪 Testing with constructed sample...");
    
    // Create test license data
    const testData = "John Doe|123456789012|19800115|LIC1234567890|20200101-20250101|B,C|None|None|M";
    console.log("Test license data:", testData);
    
    // Compress with zlib (use deflate for compression)
    const compressed = deflate(new TextEncoder().encode(testData));
    console.log("Compressed length:", compressed.length);
    console.log("Compressed preview:", Array.from(compressed.slice(0, 8)).map(b => `0x${b.toString(16)}`).join(' '));
    
    // Encrypt with XOR
    const keyBytes = new TextEncoder().encode(MadagascarLicenseDecoder.STATIC_ENCRYPTION_KEY);
    const encrypted = new Uint8Array(compressed.length);
    for (let i = 0; i < compressed.length; i++) {
      encrypted[i] = compressed[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to hex
    const hex = Array.from(encrypted).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("Generated hex:", hex);
    
    // Now try to decode it
    return this.decodeBarcodeData(hex);
  }
}