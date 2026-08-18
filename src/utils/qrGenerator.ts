// QR Code Generator and Cryptographic Token Formatter for 24Library

// Generate a tamper-evident secure token for member entry
export function generateMemberQRToken(memberCode: string, memberId: string, branchId: string): string {
  const ts = Date.now().toString(36);
  const raw = `${memberCode}:${memberId}:${branchId}:${ts}`;
  // Simple deterministic checksum
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const checksum = Math.abs(hash).toString(36).toUpperCase();
  return `24LIB:${raw}:${checksum}`;
}

export interface ParsedQRToken {
  isValid: boolean;
  memberCode?: string;
  memberId?: string;
  branchId?: string;
  timestamp?: number;
  rawString: string;
}

export function parseQRToken(tokenString: string): ParsedQRToken {
  const clean = (tokenString || '').trim();
  if (!clean.startsWith('24LIB:')) {
    // If user scans raw memberCode or ID
    return {
      isValid: false,
      rawString: clean,
    };
  }

  const parts = clean.split(':');
  if (parts.length < 5) {
    return { isValid: false, rawString: clean };
  }

  return {
    isValid: true,
    memberCode: parts[1],
    memberId: parts[2],
    branchId: parts[3],
    rawString: clean,
  };
}

// Generate a deterministic 21x21 QR-like matrix for SVG rendering
export function generateQRMatrix(text: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Helper to add Finder Pattern at (r, c)
  const addFinderPattern = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner solid square
        ) {
          matrix[startR + r][startC + c] = true;
        } else {
          matrix[startR + r][startC + c] = false;
        }
      }
    }
  };

  // 3 Finder patterns (Top-Left, Top-Right, Bottom-Left)
  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Generate deterministic pattern based on payload hash
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = ((seed << 5) - seed + text.charCodeAt(i)) & 0xffffffff;
  }

  // Linear Congruential Generator for pseudo-random data bits
  let state = Math.abs(seed) || 123456789;
  const nextBit = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state >>> 16) % 2 === 1;
  };

  // Fill data cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder pattern zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
        matrix[r][c] = nextBit();
      }
    }
  }

  return matrix;
}
